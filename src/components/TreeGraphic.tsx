export default function TreeGraphic({ size = 360 }: { size?: number }) {
	const trunkWidth = size * 0.14;
	const trunkHeight = size * 0.38;
	const canopyRadius = size * 0.42;
	const appleR = size * 0.035;
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			aria-label="tree"
			role="img"
		>
			{/* shadow */}
			<ellipse
				cx={size / 2}
				cy={size - size * 0.06}
				rx={size * 0.28}
				ry={size * 0.06}
				fill="rgba(0,0,0,0.08)"
			/>
			{/* trunk */}
			<rect
				x={size / 2 - trunkWidth / 2}
				y={size - trunkHeight - size * 0.12}
				rx={trunkWidth * 0.2}
				width={trunkWidth}
				height={trunkHeight}
				fill="#6b4f2a"
			/>
			{/* canopy */}
			<circle
				cx={size / 2}
				cy={size * 0.44}
				r={canopyRadius}
				fill="#2f8a41"
			/>
			{/* leaves blobs */}
			<circle cx={size * 0.35} cy={size * 0.40} r={canopyRadius * 0.55} fill="#3fa34d" />
			<circle cx={size * 0.62} cy={size * 0.42} r={canopyRadius * 0.5} fill="#3a9a4a" />
			<circle cx={size * 0.48} cy={size * 0.62} r={canopyRadius * 0.45} fill="#3fa34d" />
			{/* apples */}
			{[
				[0.4, 0.35],
				[0.6, 0.36],
				[0.5, 0.30],
				[0.37, 0.48],
				[0.63, 0.50],
				[0.47, 0.55],
				[0.56, 0.62],
				[0.42, 0.62],
			].map(([x, y], i) => (
				<g key={i}>
					<circle cx={size * x} cy={size * y} r={appleR} fill="#c0392b" />
					<rect
						x={size * x - appleR * 0.15}
						y={size * y - appleR * 1.2}
						width={appleR * 0.3}
						height={appleR * 0.5}
						fill="#6b4f2a"
						rx={appleR * 0.1}
					/>
					<path
						d={`M ${size * x} ${size * y - appleR * 1.2} q ${-appleR * 0.5} ${-appleR * 0.6} ${-appleR} 0`}
						stroke="#2f8a41"
						fill="transparent"
						strokeWidth={appleR * 0.15}
						strokeLinecap="round"
					/>
				</g>
			))}
		</svg>
	);
}


