// --- GLOBAL IMAGE ZOOM MODAL ---
document.addEventListener('DOMContentLoaded', () => {
    const zoomModal = document.getElementById('global-zoom-modal');
    const zoomImg = document.getElementById('global-zoom-image');
    const closeBtn = document.getElementById('close-zoom-modal');
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const resetBtn = document.getElementById('zoom-reset-btn');
    const scrollContainer = document.getElementById('zoom-scroll-container');
    
    let currentScale = 1;
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    if(!zoomModal || !zoomImg) return;

    // Attach click listeners to all clickable images
    document.body.addEventListener('click', (e) => {
        // Target Intel Vault images, Comms feed images, etc.
        const targetImg = e.target.closest('#intel-vault-grid img, #chat-messages img, #ammoLibraryList img');
        if(targetImg) {
            e.stopPropagation();
            openZoomModal(targetImg.src);
        }
    });

    function openZoomModal(src) {
        zoomImg.src = src;
        currentScale = 1;
        updateTransform();
        zoomModal.classList.remove('hidden', 'pointer-events-none', 'opacity-0');
        zoomModal.classList.add('flex', 'opacity-100');
        if (window.lucide) lucide.createIcons();
    }

    function closeZoomModal() {
        zoomModal.classList.remove('opacity-100');
        zoomModal.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => {
            zoomModal.classList.add('hidden');
            zoomModal.classList.remove('flex');
            zoomImg.src = '';
        }, 300);
    }

    closeBtn.addEventListener('click', closeZoomModal);
    
    // Zoom Controls
    zoomInBtn.addEventListener('click', () => { currentScale = Math.min(currentScale + 0.5, 5); updateTransform(); });
    zoomOutBtn.addEventListener('click', () => { currentScale = Math.max(currentScale - 0.5, 0.5); updateTransform(); });
    resetBtn.addEventListener('click', () => { currentScale = 1; updateTransform(); });

    function updateTransform() {
        zoomImg.style.transform = "scale(${currentScale})";
        zoomImg.style.transform = 'scale(' + currentScale + ')';
    }

    // Drag to pan
    zoomImg.addEventListener('mousedown', (e) => {
        if(currentScale <= 1) return;
        isDragging = true;
        startX = e.pageX - scrollContainer.offsetLeft;
        startY = e.pageY - scrollContainer.offsetTop;
        scrollLeft = scrollContainer.scrollLeft;
        scrollTop = scrollContainer.scrollTop;
    });

    zoomImg.addEventListener('mouseleave', () => isDragging = false);
    zoomImg.addEventListener('mouseup', () => isDragging = false);

    zoomImg.addEventListener('mousemove', (e) => {
        if(!isDragging || currentScale <= 1) return;
        e.preventDefault();
        const x = e.pageX - scrollContainer.offsetLeft;
        const y = e.pageY - scrollContainer.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        scrollContainer.scrollLeft = scrollLeft - walkX;
        scrollContainer.scrollTop = scrollTop - walkY;
    });
});
