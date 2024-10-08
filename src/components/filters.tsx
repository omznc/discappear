import type { MessageWithChannel } from "@/App";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dispatch, SetStateAction } from "react";

export type Filter = {
	query: string;
	dms: boolean;
	guilds: boolean;
};

export function FilterForm({
	filter,
	setFilter,
	filteredData,
	deleteMessageHandler,
}: {
	filter: Filter;
	setFilter: Dispatch<SetStateAction<Filter>>;
	filteredData: {
		dms: MessageWithChannel[];
		guilds: MessageWithChannel[];
	};
	deleteMessageHandler: () => void;
}) {
	return (
		<div className="flex flex-col gap-3 size-full">
			<Input
				type="text"
				className="w-full"
				placeholder="Filter messages containing..."
				value={filter.query}
				onChange={(e) => setFilter({ ...filter, query: e.target.value })}
			/>
			<div className="flex space-x-4 size-full">
				<CheckboxWithLabel
					id="dms"
					label="Include DMs"
					checked={filter.dms}
					onCheckedChange={(checked) => setFilter({ ...filter, dms: Boolean(checked) })}
				/>
				<CheckboxWithLabel
					id="guilds"
					label="Include Servers"
					checked={filter.guilds}
					onCheckedChange={(checked) => setFilter({ ...filter, guilds: Boolean(checked) })}
				/>
			</div>
			<Button disabled={filteredData.dms.length + filteredData.guilds.length === 0} onClick={deleteMessageHandler}>
				Delete Filtered Messages ({filteredData.dms.length + filteredData.guilds.length})
			</Button>
		</div>
	);
}

function CheckboxWithLabel({
	id,
	label,
	checked,
	onCheckedChange,
}: {
	id: string;
	label: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className="flex items-center space-x-2">
			<Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} />
			<Label htmlFor={id}>{label}</Label>
		</div>
	);
}
