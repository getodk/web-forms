import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getNodeForReference } from '../src/client/traversal.ts';
import { Scenario } from '../src/jr/Scenario.ts';

import { JRResourceService } from '@getodk/common/jr-resources/JRResourceService.ts';
import { constants, type GeolocationProvider, type InstanceData } from '@getodk/xforms-engine';
const { INSTANCE_FILE_NAME, INSTANCE_FILE_TYPE } = constants;

import { readdir, readFile } from 'fs/promises';
import { FormDefinitionResource } from '../src/jr/resource/FormDefinitionResource.ts';

const csvFixture = `
{
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "title": "Last time red kangaroo was spotted",
                "info": "A a large red kangaroo was observed at 10:45 AM",
                "id": "1"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [134.795, -28.978]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "title": "Red kangaroo feeding trail",
                "info": "The trail that red kangaroos follow to reach their favorite spot food",
                "id": "2"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [134.75, -28.981],
                    [134.76, -28.981],
                    [134.77, -28.981]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "title": "Red kangaroo resting area",
                "info": "The area where kangaroos are typically found when resting",
                "id": "3"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [134.77, -28.957],
                        [134.79, -28.957],
                        [134.79, -28.945],
                        [134.77, -28.945],
                        [134.77, -28.957]
                    ]
                ]
            }
        }
    ]
}
`;


// ~/src/getodk/web-forms/packages/scenario$ npx vitest test/upgrade.test.ts --silent=false

const getFixtures = async () => {
    const result = [];
    const source = __dirname + '/upgrade';

    const dirs = await readdir(source, { withFileTypes: true });
    for (const dir of dirs) {
        if (!dir.isDirectory()) {
            continue;
        }
        const form = `${source}/${dir.name}/form.xml`;

        const submissionDirName = `${source}/${dir.name}/submissions`;
        const submissions = (await readdir(submissionDirName, { withFileTypes: true }))
            .map(file => `${source}/${dir.name}/submissions/${file.name}`);
        const fixture = {
            name: dir.name,
            form,
            submissions
        };


        result.push(fixture);
    }
    return result;
};

describe('Upgrade test', async () => {

	let resourceService: JRResourceService;

    const fixtures = await getFixtures();

	beforeEach(() => {
		resourceService = new JRResourceService();
	});

	afterEach(() => {
		resourceService.reset();
	});

    // const compare = (originalNode:BaseNode, editedNode:BaseNode) => {
    //     console.log('val', editedNode.currentState.value, originalNode.currentState.value);
    //     expect(editedNode.currentState.value).toBe(originalNode.currentState.value);
    //     if (!editedNode.currentState.children && !originalNode.currentState.children) {
    //         return;
    //     } else if (!editedNode.currentState.children || !originalNode.currentState.children) {
    //         throw new Error();
    //     }
    //     expect(editedNode.currentState.children.length).toBe(originalNode.currentState.children.length);
    //     for (let i = 0; i < originalNode.currentState.children.length; i++) {
    //         const originalChild = originalNode.currentState.children[i];
    //         const editedChild = editedNode.currentState.children[i];
    //         if (!originalChild && !editedChild) {
    //             continue;
    //         } else if (!originalChild || !editedChild) {
    //             throw new Error('one child was null/undefined');
    //         }
    //         compare(originalChild, editedChild);
    //     }
    // };

    type MockAction = 'clone' | 'delete' | 'clear';

    const mockXML = (input:Document, edited:Scenario, xpath:string, action:MockAction) => {
        const editedNode = getNodeForReference(edited.instanceRoot, xpath);
        if (!editedNode) {
            if (action === 'delete') {
                return;
            } else {
                throw new Error(`Node ${xpath} not found`);
            }
        }
        const nodeName = editedNode.definition.qualifiedName.localName;
        let value;
        if (action === 'clone') {
            const originalValue = input.evaluate(xpath, input, null, XPathResult.STRING_TYPE);
            value = `<${nodeName}>${originalValue.stringValue}</${nodeName}>`;
        } else if (action === 'delete') {
            value = '';
        } else {
            value = `<${nodeName}/>`;
        }
        Object.defineProperty(editedNode.instanceState, 'instanceXML', {
            value,
            writable: false
        });
    };

    for (const fixture of fixtures) {
        const formXml = await readFile(fixture.form, { encoding: 'utf8' });
        const form = new FormDefinitionResource(fixture.form, formXml);
        const parser = new DOMParser();
        const formDocument = parser.parseFromString(formXml, 'text/xml');
        const actions = formDocument.evaluate('//*[@event]', formDocument, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
        let action;
        const actionRefs:string[] = [];
        while ((action = actions.iterateNext()) !== null) {
            const event = action.getAttribute && action.getAttribute('event');
            const ref = action.getAttribute && action.getAttribute('ref');
            if (event && ref && event.includes('odk-instance-load')) {
                actionRefs.push(ref);
            }
        }
        for (const submission of fixture.submissions) {
            it.only(`can edit submission: ${submission}`, async () => {

                // TODO read this from the directory too
                const csvAttachmentFileName = 'cities.geojson';
                const csvAttachmentURL = `jr://file/${csvAttachmentFileName}` as const;
                resourceService.activateResource(
                    {
                        url: csvAttachmentURL,
                        fileName: csvAttachmentFileName,
                        mimeType: 'application/geo+json'
                    },
                    csvFixture
                );


                const submissionXml = await readFile(submission, { encoding: 'utf8' });

                const domParser = new DOMParser();
                const inputDocument = domParser.parseFromString(submissionXml, 'text/xml');
                const geolocationProvider: GeolocationProvider = { getLocation: () => Promise.resolve('123 456 789 0') };

                const originalScenario = await Scenario.gareth(form, { geolocationProvider, resourceService });
                const instanceXML = `<?xml version="1.0" encoding="UTF-8"?> ${submissionXml}`;
                const instanceFile = new File([instanceXML], INSTANCE_FILE_NAME, { type: INSTANCE_FILE_TYPE });
                const instanceData = new FormData();
                instanceData.set(INSTANCE_FILE_NAME, instanceFile);
                const editedScenario = await originalScenario.editWebFormsInstanceState({ inputType: 'FORM_INSTANCE_INPUT_RESOLVED', data: [instanceData as InstanceData] });
                mockXML(inputDocument, editedScenario, '/data/meta/instanceID', 'clone');
                mockXML(inputDocument, editedScenario, '/data/meta/deprecatedID', 'delete');

                actionRefs.forEach(ref => {
                    mockXML(inputDocument, editedScenario, ref, 'clone');
                });

                const editedResult = editedScenario.proposed_serializeInstance();
                expect(editedResult).toBe(submissionXml);
            });
        }
    }


});
