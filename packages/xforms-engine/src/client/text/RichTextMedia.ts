import type { ActiveLanguage } from '../FormLanguage.ts';
import type { AudioMediaResource } from '../media/AudioMediaResource.ts';
import type { ImageMediaResource } from '../media/ImageMediaResource.ts';
import type { MediaResource } from '../media/MediaResource.ts';
import type { VideoMediaResource } from '../media/VideoMediaResource.ts';
import type { RichText } from './RichText.ts';

/**
 * Represents media resources associated with a {@link RichText}. Media
 * resources will typically be computed from a form's
 * {@link https://getodk.github.io/xforms-spec/#media | itext media}. As such,
 * they may be recomputed when a form's {@link ActiveLanguage} is changed.
 */
export interface RichTextMedia extends Iterable<MediaResource> {
	get audio(): AudioMediaResource | null;
	get image(): ImageMediaResource | null;
	get video(): VideoMediaResource | null;
}
