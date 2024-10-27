import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const BlinkSkeleton = () => (
	<Card className="overflow-hidden">
		<div className="p-4 space-y-4">
			<Skeleton className="w-full h-48 rounded-lg" />
			<div className="space-y-2">
				<Skeleton className="h-4 w-1/4" />
				<Skeleton className="h-4 w-full" />
				<Skeleton className="h-4 w-3/4" />
			</div>
			<Skeleton className="h-10 w-full rounded-md" />
		</div>
	</Card>
);


export default BlinkSkeleton;