<script lang="ts" setup>
import type { SelectNodeAppearances } from '@getodk/xforms-engine';

defineProps<{ appearances: SelectNodeAppearances }>();
</script>

<template>
	<div class="table-row" :class="[...appearances]">
		<div class="first-col">
			<slot name="firstColumn" />
		</div>
		<slot />
	</div>
</template>

<style lang="scss" scoped>
.table-row {
	display: table-row;
	border-radius: var(--odk-radius);
	margin-bottom: 6px;
	padding-left: 10px;

	:deep(.control-text) {
		margin-bottom: 0;
	}

	.first-col {
		display: table-cell;
		width: 100%;
		text-align: left;
		vertical-align: middle;
	}

	:deep(.value-option) {
		display: table-cell;
		min-width: 50px;
		text-align: center;
		vertical-align: middle;
		padding: 15px 5px;
		outline: none;
		background-color: unset;

		&.active {
			background-color: unset;
			outline: none;
		}

		&:hover {
			background: unset;
		}

		.label-text {
			display: block;
			margin-left: 0;
		}
	}
}

.table-row.list-nolabel {
	&:hover {
		background-color: var(--odk-muted-background-color);
	}

	:deep(.value-option) {
		border-radius: var(--odk-radius);
		background-color: transparent;
		.label-text {
			display: none;
		}
	}
}

.table-row.label {
	padding: 0px;

	:deep(.value-option) {
		cursor: default;

		&.active {
			border: 2px solid var(--odk-primary-border-color);
		}

		.p-radiobutton {
			display: none;
		}

		.p-checkbox {
			display: none;
		}

		&:has(.p-checkbox-input:hover),
		&:has(.p-radiobutton-input:hover) {
			background-color: unset;
			outline: none;
		}
	}
}

.table-row.list {
	margin-top: -30px;

	&:hover {
		background-color: var(--odk-muted-background-color);
	}

	:deep(.value-option) {
		position: relative;

		.p-checkbox,
		.p-radiobutton {
			position: relative;
			top: 26px;
		}

		.label-text {
			position: relative;
			top: -20px;
			margin-bottom: 10px;
			white-space: nowrap;
		}
	}
}
</style>
