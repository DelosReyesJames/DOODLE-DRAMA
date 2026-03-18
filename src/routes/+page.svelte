<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let isDrawing = false;
	let brushColor = '#FF1493';
	let brushSize = 8;
	let brushType = 'marker';
	let isEraser = false;

	const colors = [
		{ name: 'Hot Pink', hex: '#FF1493' },
		{ name: 'Electric Purple', hex: '#9D4EDD' },
		{ name: 'Neon Orange', hex: '#FF6B35' },
		{ name: 'Lime Green', hex: '#00FF00' },
		{ name: 'Sky Blue', hex: '#00D9FF' },
		{ name: 'Sunny Yellow', hex: '#FFFD38' },
		{ name: 'Deep Purple', hex: '#6A0572' },
		{ name: 'Black', hex: '#000000' }
	];

	const brushTypes = [
		{ name: 'Marker', id: 'marker', label: '🖍️' },
		{ name: 'Crayon', id: 'crayon', label: '✏️' },
		{ name: 'Brush', id: 'brush', label: '🎨' },
		{ name: 'Glitter', id: 'glitter', label: '✨' }
	];

	const stickers = ['🌟', '😊', '🎭', '🎨', '💡', '🎪', '🌈', '🎉', '⭐', '💖'];

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
		};
	});

	function resizeCanvas() {
		const rect = canvas.parentElement?.getBoundingClientRect();
		if (rect) {
			const dpr = window.devicePixelRatio || 1;
			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;
			ctx.scale(dpr, dpr);
		}
	}

	function getCoordinates(e: TouchEvent | MouseEvent | PointerEvent) {
		const rect = canvas.getBoundingClientRect();

		if (e instanceof TouchEvent) {
			return {
				x: e.touches[0].clientX - rect.left,
				y: e.touches[0].clientY - rect.top
			};
		}

		return {
			x: ('clientX' in e ? e.clientX : 0) - rect.left,
			y: ('clientY' in e ? e.clientY : 0) - rect.top
		};
	}

	function startDrawing(e: TouchEvent | MouseEvent) {
		isDrawing = true;
		const { x, y } = getCoordinates(e);

		if (isEraser) {
			ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
		} else {
			if (brushType === 'marker' || brushType === 'crayon') {
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.lineCap = 'round';
				ctx.lineJoin = 'round';
				ctx.strokeStyle = brushColor;
				ctx.lineWidth = brushType === 'crayon' ? brushSize + 2 : brushSize;
				ctx.lineTo(x, y);
				ctx.stroke();
			} else {
				drawBrushShape(x, y);
			}
		}
		e.preventDefault();
	}

	function drawMarker(x: number, y: number) {
		ctx.strokeStyle = brushColor;
		ctx.lineWidth = brushSize;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineTo(x, y);
		ctx.stroke();
	}

	function drawCrayon(x: number, y: number) {
		ctx.strokeStyle = brushColor;
		ctx.lineWidth = brushSize + 2;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineTo(x, y);
		ctx.stroke();
	}

	function drawBrush(x: number, y: number) {
		ctx.fillStyle = brushColor;
		ctx.beginPath();
		ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
		ctx.fill();
	}

	function drawGlitter(x: number, y: number) {
		ctx.fillStyle = brushColor;
		for (let i = 0; i < 3; i++) {
			const offsetX = (Math.random() - 0.5) * brushSize * 1.5;
			const offsetY = (Math.random() - 0.5) * brushSize * 1.5;
			ctx.beginPath();
			ctx.arc(x + offsetX, y + offsetY, Math.random() * (brushSize / 3), 0, Math.PI * 2);
			ctx.fill();
		}
	}

	function draw(e: TouchEvent | MouseEvent) {
		if (!isDrawing) return;

		const { x, y } = getCoordinates(e);

		if (isEraser) {
			ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize);
		} else {
			drawBrushShape(x, y);
		}
		e.preventDefault();
	}

	function drawBrushShape(x: number, y: number) {
		switch (brushType) {
			case 'marker':
				drawMarker(x, y);
				break;
			case 'crayon':
				drawCrayon(x, y);
				break;
			case 'brush':
				drawBrush(x, y);
				break;
			case 'glitter':
				drawGlitter(x, y);
				break;
		}
	}

	function stopDrawing() {
		if (brushType === 'marker' || brushType === 'crayon') {
			ctx.closePath();
		}
		isDrawing = false;
	}

	function clearCanvas() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	function downloadDrawing() {
		const link = document.createElement('a');
		link.href = canvas.toDataURL('image/png');
		link.download = 'doodle-drama-masterpiece.png';
		link.click();
	}

	function setBrush(type: string) {
		brushType = type;
		isEraser = false;
	}

	function setEraser() {
		isEraser = true;
	}

	function addSticker(emoji: string) {
		const fontSize = brushSize * 4;
		ctx.font = `${fontSize}px Arial`;
		const x = canvas.width / 2 / (window.devicePixelRatio || 1);
		const y = canvas.height / 2 / (window.devicePixelRatio || 1);
		ctx.fillText(emoji, x - fontSize / 2, y);
	}
</script>

<svelte:window on:touchend={stopDrawing} on:mouseup={stopDrawing} />

<div class="container">
	<div class="header">
		<h1>🎨 DOODLE DRAMA 🎪</h1>
		<p>Create Your Masterpiece!</p>
		<div class="stars">⭐ ✨ 🌟 ✨ ⭐</div>
	</div>

	<div class="canvas-wrapper">
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<canvas
			bind:this={canvas}
			on:pointerdown={startDrawing}
			on:pointermove={draw}
			on:pointerup={stopDrawing}
			on:pointerleave={stopDrawing}
			class="doodle-canvas"
		></canvas>
	</div>

	<div class="controls">
		<!-- Colors Section -->
		<div class="control-section">
			<h3>🌈 Pick Your Color:</h3>
			<div class="color-palette">
				{#each colors as color}
					<button
						class="color-btn"
						style="background-color: {color.hex}; border: {brushColor === color.hex && !isEraser
							? '4px solid #333'
							: '3px solid rgba(0,0,0,0.2)'}"
						on:click={() => {
							brushColor = color.hex;
							isEraser = false;
						}}
						title={color.name}
					>
					</button>
				{/each}
			</div>
		</div>

		<!-- Brush Types Section -->
		<div class="control-section">
			<h3>✏️ Choose Your Tool:</h3>
			<div class="brush-buttons">
				{#each brushTypes as brush}
					<button
						class="brush-btn {brushType === brush.id && !isEraser ? 'active' : ''}"
						on:click={() => setBrush(brush.id)}
						title={brush.name}
					>
						<span class="brush-icon">{brush.label}</span>
						<span class="brush-name">{brush.name}</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Size Control Section -->
		<div class="control-section">
			<h3>📏 Size: <strong>{brushSize}px</strong></h3>
			<input type="range" min="3" max="40" bind:value={brushSize} class="size-slider" />
		</div>

		<!-- Stickers Section -->
		<div class="control-section">
			<h3>✨ Fun Stickers:</h3>
			<div class="stickers-grid">
				{#each stickers as sticker}
					<button
						class="sticker-btn"
						on:click={() => addSticker(sticker)}
					>
						{sticker}
					</button>
				{/each}
			</div>
		</div>

		<!-- Tools Section -->
		<div class="control-section">
			<h3>🛠️ Tools:</h3>
			<div class="tool-buttons">
				<button
					class="tool-btn eraser-btn {isEraser ? 'active' : ''}"
					on:click={setEraser}
				>
					🗑️ Eraser
				</button>
				<button class="tool-btn clear-btn" on:click={clearCanvas}>
					🔄 Clear
				</button>
				<button class="tool-btn download-btn" on:click={downloadDrawing}>
					💾 Save
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Comic Sans MS', 'Trebuchet MS', cursive, sans-serif;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		touch-action: none;
	}

	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		max-width: 100%;
	}

	.header {
		background: linear-gradient(135deg, #FF1493, #9D4EDD);
		color: white;
		padding: 0.75rem 1rem;
		text-align: center;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		border-bottom: 5px dashed white;
	}

	.header h1 {
		margin: 0;
		font-size: 1.8rem;
		font-weight: bold;
		text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.3);
		letter-spacing: 2px;
		animation: bounce 1s ease-in-out infinite;
	}

	.header p {
		margin: 0.25rem 0 0 0;
		font-size: 0.9rem;
		opacity: 0.95;
		text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.2);
	}

	.stars {
		margin-top: 0.25rem;
		font-size: 1.2rem;
		letter-spacing: 0.2rem;
		animation: twinkle 1.5s ease-in-out infinite;
	}

	.canvas-wrapper {
		flex: 1;
		overflow: hidden;
		background: linear-gradient(to bottom, #ffffff, #f0f0f0);
		box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
		cursor: crosshair;
		background: white;
	}

	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		padding: 0.75rem;
		background: linear-gradient(to right, #00D9FF, #00FF00);
		align-items: flex-start;
		justify-content: center;
		overflow-y: auto;
		box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.2);
		max-height: 200px;
	}

	.control-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.control-section h3 {
		margin: 0;
		font-size: 0.9rem;
		font-weight: bold;
		color: white;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
	}

	.color-palette {
		display: flex;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	.color-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		border: 3px solid rgba(0, 0, 0, 0.2);
	}

	.color-btn:hover {
		transform: scale(1.15) rotate(5deg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	.color-btn:active {
		transform: scale(0.9);
	}

	.brush-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.brush-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.2rem;
		padding: 0.5rem;
		background-color: white;
		border: 3px solid #333;
		border-radius: 12px;
		cursor: pointer;
		font-size: 0.75rem;
		font-weight: bold;
		transition: all 0.2s;
		min-width: 60px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
	}

	.brush-btn:hover {
		background-color: #FFFD38;
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.brush-btn.active {
		background-color: #FF1493;
		color: white;
		border-color: #9D4EDD;
		box-shadow: 0 0 20px rgba(255, 20, 147, 0.7);
	}

	.brush-icon {
		font-size: 1.2rem;
	}

	.brush-name {
		font-size: 0.65rem;
		text-transform: capitalize;
	}

	.stickers-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 0.3rem;
	}

	.sticker-btn {
		font-size: 1.5rem;
		background: white;
		border: 2px solid #333;
		border-radius: 6px;
		cursor: pointer;
		padding: 0.3rem;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.sticker-btn:hover {
		transform: scale(1.1) rotate(-5deg);
		box-shadow: 0 3px 10px rgba(0, 0, 0, 0.3);
	}

	.sticker-btn:active {
		transform: scale(0.9);
	}

	.size-slider {
		width: 200px;
		height: 8px;
		cursor: pointer;
		accent-color: #FF6B6B;
	}

	.tool-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.tool-btn {
		padding: 0.5rem 0.8rem;
		border: none;
		border-radius: 12px;
		font-size: 0.85rem;
		font-weight: bold;
		cursor: pointer;
		transition: all 0.2s;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
		color: white;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
	}

	.tool-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
	}

	.tool-btn:active {
		transform: translateY(0);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
	}

	.eraser-btn {
		background: linear-gradient(135deg, #667eea, #764ba2);
	}

	.eraser-btn.active {
		background: linear-gradient(135deg, #764ba2, #667eea);
		box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
	}

	.clear-btn {
		background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
	}

	.clear-btn:hover {
		background: linear-gradient(135deg, #ee5a6f, #ff6b6b);
	}

	.download-btn {
		background: linear-gradient(135deg, #6bcb77, #4d96ff);
	}

	.download-btn:hover {
		background: linear-gradient(135deg, #4d96ff, #6bcb77);
	}

	@media (max-width: 768px) {
		.header h1 {
			font-size: 1.3rem;
		}

		.header p {
			font-size: 0.8rem;
		}

		.stars {
			font-size: 1rem;
		}

		.controls {
			gap: 0.75rem;
			padding: 0.6rem;
		}

		.control-section {
			width: 100%;
		}

		.color-palette {
			width: 100%;
		}

		.color-btn {
			width: 35px;
			height: 35px;
		}

		.size-slider {
			width: 100%;
			max-width: 200px;
		}

		.brush-buttons {
			width: 100%;
			justify-content: flex-start;
		}

		.tool-buttons {
			width: 100%;
			justify-content: flex-start;
		}

		.tool-btn {
			flex: 1;
			min-width: 80px;
			font-size: 0.8rem;
			padding: 0.4rem 0.6rem;
		}
	}

	@media (max-width: 480px) {
		.header h1 {
			font-size: 1.1rem;
		}

		.header p {
			font-size: 0.7rem;
		}

		.stars {
			font-size: 0.8rem;
		}

		.control-section h3 {
			font-size: 0.8rem;
		}

		.brush-btn {
			min-width: 50px;
			padding: 0.4rem;
			font-size: 0.7rem;
		}

		.brush-icon {
			font-size: 1rem;
		}

		.brush-name {
			font-size: 0.6rem;
		}

		.tool-btn {
			font-size: 0.75rem;
			padding: 0.4rem 0.5rem;
		}

		.color-btn {
			width: 30px;
			height: 30px;
		}

		.sticker-btn {
			font-size: 1.2rem;
			padding: 0.2rem;
		}
	}
</style>
