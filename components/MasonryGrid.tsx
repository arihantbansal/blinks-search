"use client";

import React, { useState, useEffect, useRef } from "react";

interface MasonryGridProps {
	children: React.ReactNode;
}

export default function MasonryGrid({ children }: MasonryGridProps) {
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

	const columnizeChildren = () => {
		const childrenArray = React.Children.toArray(children);
		const columnHeights = new Array(columns).fill(0);
		const columnContents: React.ReactNode[][] = new Array(columns)
			.fill(null)
			.map(() => []);

		childrenArray.forEach((child) => {
			const shortestColumnIndex = columnHeights.indexOf(
				Math.min(...columnHeights)
			);
			columnContents[shortestColumnIndex].push(child);
			columnHeights[shortestColumnIndex] += 1; // Ideally, this would be the actual height of the element
		});

		return columnContents;
	};

	return (
		<div
			ref={containerRef}
			className="grid gap-4"
			style={{
				gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
			}}
		>
			{columnizeChildren().map((column, i) => (
				<div key={i} className="flex flex-col gap-4">
					{column}
				</div>
			))}
		</div>
	);
}
