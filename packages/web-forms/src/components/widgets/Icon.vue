<script setup lang="ts">
type MidSize = 'md-18' | 'md-24' | 'md-36' | 'md-48';
interface IconProps {
	alias: string;
	size?: MidSize;
}
const props = defineProps<IconProps>();
</script>

<template>
	<span class="material-icons" :class="size">{{ alias }}</span>
</template>

<style scoped lang="scss">

$default-size: 24px;

.material-icons {
	font-family: 'Material Icons';
	font-weight: normal;
	font-style: normal;
	font-size: $default-size;
	display: inline-block;
	line-height: 1;
	text-transform: none;
	letter-spacing: normal;
	word-wrap: normal;
	white-space: nowrap;
	direction: ltr;

	/* Support for all WebKit browsers. */
	-webkit-font-smoothing: antialiased;

	/* Support for Safari and Chrome. */
	text-rendering: optimizeLegibility;

	/* Support for Firefox. */
	-moz-osx-font-smoothing: grayscale;

	/* Support for IE. */
	font-feature-settings: 'liga';
}

.material-icons.md-18 { font-size: 18px; }
.material-icons.md-24 { font-size: $default-size; }
.material-icons.md-36 { font-size: 36px; }
.material-icons.md-48 { font-size: 48px; }

</style>
