import { Route, Router } from '@solidjs/router';
import { App } from '../../App.tsx';
import { DemoContextProvider } from './DemoContext.tsx';
import { DEMO_FORM_BASE_PATH, DemoForm } from './DemoForm.tsx';
import { DEMO_ROOT_PATH, DemoRoot } from './DemoRoot.tsx';
import { UPLOADED_FORM_PATH, UploadedForm } from './UploadedForm.tsx';

export const DemoRouter = () => {
	return (
		<DemoContextProvider>
			<Router root={App}>
				<Route path={DEMO_ROOT_PATH} component={DemoRoot} />
				<Route path={DEMO_FORM_BASE_PATH} component={DemoForm} />
				<Route path={UPLOADED_FORM_PATH} component={UploadedForm} />
			</Router>
		</DemoContextProvider>
	);
};
