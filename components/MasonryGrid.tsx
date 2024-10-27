import React, { useState, useRef, useEffect } from "react";

const MasonryGrid = ({ children }: { children: React.ReactNode }) => {
	const [columns, setColumns] = useState(3);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const updateColumns = () => {
			const width = containerRef.current?.offsetWidth || 0;
			if (width >= 1024) setColumns(3); // lg breakpoint
			else if (width >= 640) setColumns(2); // sm breakpoint
			else setColumns(1); // mobile
		};

		updateColumns();
		window.addEventListener("resize", updateColumns);
		return () => window.removeEventListener("resize", updateColumns);
	}, []);

	const columnizedChildren = () => {
		const cols = Array.from({ length: columns }, () => [] as React.ReactNode[]);
		React.Children.forEach(children, (child, i) => {
			cols[i % columns].push(child);
		});
		return cols;
	};

	return (
		<div
			ref={containerRef}
			className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{columnizedChildren().map((columnChildren, i) => (
				<div key={i} className="flex flex-col gap-4">
					{columnChildren}
				</div>
			))}
		</div>
	);
};

export default MasonryGrid;