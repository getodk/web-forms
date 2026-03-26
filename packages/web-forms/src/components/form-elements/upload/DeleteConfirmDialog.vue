<script setup lang="ts">
import { FORMAT_MESSAGE } from '@/lib/constants/injection-keys.ts';
import type { FormatMessage } from '@/lib/locale/useLocale.ts';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { inject } from 'vue';

defineProps<{
	visible: boolean;
}>();

const formatMessage: FormatMessage = inject(FORMAT_MESSAGE)!;
const emit = defineEmits(['update:visible', 'deleteFile']);
</script>

<template>
	<Dialog
		:visible="visible"
		modal
		:draggable="false"
		@update:visible="emit('update:visible', $event)"
	>
		<template #header>
			<strong>{{ formatMessage({ id: 'upload_delete_dialog.header.title' }) }}</strong>
		</template>

		<template #default>
			<p>{{ formatMessage({ id: 'upload_delete_dialog.body.message' }) }}</p>
		</template>

		<template #footer>
			<Button :label="formatMessage({ id: 'upload_delete_dialog.delete.label' })" @click="emit('deleteFile')" />
		</template>
	</Dialog>
</template>
