<script setup lang="ts">
import { Html5Qrcode } from 'html5-qrcode';
import pako from 'pako';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { store } from './store.js';

const res = ref<string>();
const router = useRouter();

function decode(qr:string) {
	const res = Uint8Array.fromBase64(qr);
	const json = pako.inflate(res);
	const json2 = new TextDecoder().decode(json);
	return JSON.parse(json2);
}

function scan() {
	function onScanSuccess(decodedText: string) {
		qr.stop();
		const serverUrl = decode(decodedText).general.server_url;
		store.url = serverUrl.replace('https://staging.getodk.cloud', '');
		router.push({ name: 'app' });
	}
	function onScanFail() {}
	const config = { fps: 10, qrbox: { width: 250, height: 250 } };
	const qr = new Html5Qrcode('reader');
	qr.start({ facingMode: 'environment' }, config, onScanSuccess, onScanFail);
};
</script>


<template>
	<button @click="scan()">Start QR code reader</button>
	<div id="reader" width="600px"></div>
	<div>{{ res }}</div>
</template>
