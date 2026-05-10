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

<div class="page">
	<div class="paper-grid"></div>

	<div class="top-sheet">
		<div class="top-icons top-left">
			<button class="icon-circle">🇬🇧</button>
		</div>
		<div class="top-icons top-right">
			<button class="icon-circle">✕</button>
		</div>

		

		<div class="card-panel">
			<div class="play-circle">▶</div>
			<div class="card-title">Drama DOODLES</div>
		</div>

		
	</div>

	<div class="board">
		<div class="canvas-shell">
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

		<div class="controls-panel">
			<div class="control-card">
				<div class="card-header">Sketch Tools</div>
				<div class="section">
					<div class="section-label">Color</div>
					<div class="color-palette">
						{#each colors as color}
							<button
								class="color-btn"
								style="background-color: {color.hex}; border: {brushColor === color.hex && !isEraser ? '4px solid #333' : '3px solid rgba(0,0,0,0.2)'}"
								on:click={() => {
								brushColor = color.hex;
								isEraser = false;
							}}
								title={color.name}
							></button>
						{/each}
					</div>
				</div>

				<div class="section row">
					<label>Brush</label>
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

				<div class="section">
					<label>Size <strong>{brushSize}px</strong></label>
					<input type="range" min="3" max="40" bind:value={brushSize} class="size-slider" />
				</div>
			</div>

			<div class="control-card small-card">
				<div class="card-header">Extras</div>
				<div class="section stickers-row">
					{#each stickers as sticker}
						<button class="sticker-btn" on:click={() => addSticker(sticker)}>{sticker}</button>
					{/each}
				</div>

				<div class="section tool-row">
					<button class="tool-btn eraser-btn {isEraser ? 'active' : ''}" on:click={setEraser}>🗑️</button>
					<button class="tool-btn clear-btn" on:click={clearCanvas}>🔄</button>
					<button class="tool-btn download-btn" on:click={downloadDrawing}>💾</button>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		font-family: 'Patrick Hand', 'Comic Sans MS', cursive, sans-serif;
		background: #f2e7c9;
		color: #2f2a25;
		touch-action: none;
	}

	.page {
		min-height: 100vh;
		padding: 1.5rem;
		position: relative;
		overflow: hidden;
	}

	.paper-grid {
		position: absolute;
		inset: 0;
		background-image:
			linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px),
			linear-gradient(0deg, rgba(255,255,255,0.45), rgba(255,255,255,0.45));
		background-size: 40px 40px, 40px 40px, 100% 100%;
		background-position: 0 0, 0 0, 0 0;
		pointer-events: none;
		opacity: 0.8;
	}

	.top-sheet {
		position: relative;
		max-width: 960px;
		margin: 0 auto 1.5rem;
		background: #fffdf5;
		border: 4px solid #2f2a25;
		border-radius: 24px;
		box-shadow: 12px 12px 0 rgba(0,0,0,0.12);
		padding: 1rem;
		overflow: hidden;
	}

	.top-sheet::before {
		content: '';
		position: absolute;
		top: 1rem;
		left: 1rem;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(255, 249, 205, 0.9);
		border: 3px solid #2f2a25;
		box-shadow: 0 0 0 6px rgba(255,255,255,0.8);
		pointer-events: none;
	}

	.top-icons {
		display: flex;
		gap: 0.75rem;
		position: absolute;
		top: 1rem;
	}

	.top-left { left: 1rem; }
	.top-right { right: 1rem; }

	.icon-circle {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: #fff;
		border: 3px solid #2f2a25;
		display: grid;
		place-items: center;
		font-size: 1.1rem;
		cursor: pointer;
		box-shadow: 4px 4px 0 rgba(0,0,0,0.12);
	}

	.level-banner {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1rem;
		padding: 0.5rem 1.25rem;
		background: #97c16b;
		color: #2f2a25;
		font-weight: 700;
		font-size: 1rem;
		border-radius: 999px;
		box-shadow: 4px 4px 0 rgba(0,0,0,0.12);
		text-transform: uppercase;
		letter-spacing: 0.15em;
		position: relative;
	}

	.card-panel {
		display: grid;
		place-items: center;
		padding: 2rem 1rem;
		margin: 0 auto;
		max-width: 420px;
		background: #fff;
		border: 4px dashed #2f2a25;
		border-radius: 24px;
		box-shadow: 10px 10px 0 rgba(0,0,0,0.1);
		position: relative;
	}

	.play-circle {
		width: 110px;
		height: 110px;
		border-radius: 50%;
		background: #ffd455;
		border: 4px solid #2f2a25;
		display: grid;
		place-items: center;
		font-size: 2.5rem;
		color: #2f2a25;
		box-shadow: inset 0 6px 0 rgba(0,0,0,0.08);
	}

	.card-title {
		margin-top: 1rem;
		font-size: 1.3rem;
		font-weight: 800;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #2f2a25;
	}

	.bottom-icons {
		display: flex;
		justify-content: center;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.board {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
		max-width: 960px;
		margin: 0 auto;
	}

	.canvas-shell {
		position: relative;
		background: #fff;
		border: 4px solid #2f2a25;
		border-radius: 24px;
		box-shadow: 12px 12px 0 rgba(0,0,0,0.1);
		overflow: hidden;
		height: min(68vh, 560px);
	}

	.doodle-canvas {
		width: 100%;
		height: 100%;
		background: #fff;
	}

	.controls-panel {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.control-card {
		background: #fff;
		border: 3px solid #2f2a25;
		border-radius: 24px;
		padding: 1rem;
		box-shadow: 8px 8px 0 rgba(0,0,0,0.08);
	}

	.small-card {
		min-height: 240px;
	}

	.card-header {
		font-size: 1rem;
		font-weight: 800;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.section.row {
		gap: 0.75rem;
	}

	.section label {
		font-size: 0.95rem;
		font-weight: 700;
	}

	.brush-buttons {
		flex-wrap: wrap;
	}

	.brush-btn {
		min-width: 72px;
		padding: 0.65rem 0.65rem;
		border-radius: 16px;
	}

	.brush-btn.active {
		background: #ffeb9a;
		color: #2f2a25;
	}

	.stickers-row {
		display: grid;
		grid-template-columns: repeat(5, minmax(0, 1fr));
		gap: 0.5rem;
	}

	.tool-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tool-btn {
		min-width: 72px;
		padding: 0.75rem 0.9rem;
		border-radius: 18px;
		font-size: 0.95rem;
	}

	.color-palette {
		justify-content: flex-start;
	}

	.color-btn {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		border: 3px solid rgba(0,0,0,0.2);
	}

	.color-btn:hover {
		transform: scale(1.15) rotate(5deg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	.color-btn:active {
		transform: scale(0.9);
	}

	.brush-icon {
		font-size: 1.2rem;
	}

	.brush-name {
		font-size: 0.65rem;
		text-transform: capitalize;
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
		width: 100%;
		height: 8px;
		cursor: pointer;
		accent-color: #FF6B6B;
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

	@media (max-width: 900px) {
		.board {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 1rem;
		}

		.top-sheet {
			padding: 0.85rem;
		}

		.icon-circle {
			width: 38px;
			height: 38px;
			font-size: 1rem;
		}

		.card-panel {
			padding: 1.5rem 1rem;
		}

		.board {
			gap: 1rem;
		}

		.control-card {
			padding: 0.85rem;
		}

		.size-slider {
			width: 100%;
		}
	}
</style>
