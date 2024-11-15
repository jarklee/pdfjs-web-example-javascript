function parent_setupEventListener() {
    const viewer = document.getElementById('viewer');

    viewer.addEventListener('mouseup', event => {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);

        let container = range.commonAncestorContainer;

        // If the commonAncestorContainer is not an element (e.g., a text node), go to its parent element
        if (container.nodeType === 3) {  // Node.TEXT_NODE
            container = container.parentNode;
        }

        if (!viewer.contains(container)) {
            return;
        }

        const text = selection.toString();
        if (!text) {
            return;
        }

        const pageIdx = parseInt($(container).parents('.page').attr('data-page-number')) - 1;

        const page = PDFViewerApplication.pdfViewer.getPageView(pageIdx);
        const pageRect = page.canvas.getClientRects()[0];
        const viewport = page.viewport;
        const coords = [];
        for (const r of range.getClientRects()) {
            const coord = viewport
                .convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y)
                .concat(
                    viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)
                );
            coords.push(coord);
        }

        showHighlight(pageIdx, coords);

        window.parent.postMessage({
            action: 'textSelect',
            page: pageIdx + 1,
            text,
            coords,
        }, "*");
    });
}

function showHighlight(pageIdx, coords) {
    const page = PDFViewerApplication.pdfViewer.getPageView(pageIdx);
    if (!page) {
        return;
    }
    const viewport = page.viewport;
    if (!page.canvas) {
        setTimeout(function () {
            showHighlight(pageIdx, coords);
            return;
        }, 100);
        return;
    }

    console.log('showHighlight', pageIdx, coords);

    const pageElement = page.canvas.parentElement;

    coords.forEach(function (rect) {
        const bounds = viewport.convertToViewportRectangle(rect);
        const el = document.createElement('div');
        el.setAttribute('class', 'selection');
        el.setAttribute('style', 'position: absolute; background-color: pink; mix-blend-mode: multiply;' +
            'left:' + Math.min(bounds[0], bounds[2]) + 'px; top:' + Math.min(bounds[1], bounds[3]) + 'px;' +
            'width:' + Math.abs(bounds[0] - bounds[2]) + 'px; height:' + Math.abs(bounds[1] - bounds[3]) + 'px;');
        pageElement.appendChild(el);
    });
}

window.addEventListener('message', function (e) {
    const detail = e.data;
    console.log(e);
    if (detail.action === 'showHighlight') {
        const coords = detail.coords;
        const pageIdx = detail.page + 1;
        showHighlight(pageIdx, coords);
    }
});

if (document.readyState === "interactive" || document.readyState === "complete") {
    parent_setupEventListener();
} else {
    document.addEventListener("DOMContentLoaded", parent_setupEventListener, true);
}