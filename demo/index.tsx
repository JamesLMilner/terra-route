import './style/index.css';
import App from './components/app';
import { hydrate, prerender as ssr } from 'preact-iso';
import { h } from 'preact';

if (typeof window !== 'undefined') {
    hydrate(<App />, document.getElementById('app'));
}

export async function prerender(data: any) {
    return await ssr(<App {...data} />);
}
