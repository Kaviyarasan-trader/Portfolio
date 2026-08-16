/* Project Images (Optional) — preview + remove newly selected files in the Django admin */
(function () {
    'use strict';
    var inputs = document.querySelectorAll('input[type="file"][multiple][name="images"]');
    inputs.forEach(function (input) {
        if (input.dataset.pimgInit) return;
        input.dataset.pimgInit = '1';

        var container = document.createElement('div');
        container.className = 'pimg-preview';
        input.parentNode.insertBefore(container, input.nextSibling);

        var current = [];
        var hint = document.createElement('p');
        hint.className = 'pimg-preview-hint';

        function render() {
            container.innerHTML = '';
            current.forEach(function (file, idx) {
                var cell = document.createElement('div');
                cell.className = 'pimg-preview-item';

                var img = document.createElement('img');
                img.alt = 'New image preview ' + (idx + 1);
                if (file._dataUrl) img.src = file._dataUrl;

                var rm = document.createElement('button');
                rm.type = 'button';
                rm.className = 'pimg-preview-remove';
                rm.innerHTML = '&times;';
                rm.title = 'Remove this image';
                rm.setAttribute('aria-label', 'Remove this image');
                rm.addEventListener('click', function () {
                    current = current.filter(function (f) { return f !== file; });
                    syncFiles();
                    render();
                });

                cell.appendChild(img);
                cell.appendChild(rm);
                container.appendChild(cell);
            });
            hint.textContent = current.length
                ? current.length + (current.length === 1 ? ' new image selected' : ' new images selected') + ' — added when you save.'
                : 'No new images selected. Pick one or more images to add.';
            container.appendChild(hint);
        }

        function syncFiles() {
            if (window.DataTransfer) {
                var dt = new DataTransfer();
                current.forEach(function (f) { dt.items.add(f); });
                input.files = dt.files;
            }
        }

        input.addEventListener('change', function () {
            current = Array.prototype.slice.call(input.files || []);
            current.forEach(function (f) {
                if (!f._dataUrl && f.type && f.type.indexOf('image/') === 0) {
                    var reader = new FileReader();
                    reader.onload = (function (file) {
                        return function () {
                            file._dataUrl = reader.result;
                            render();
                        };
                    })(f);
                    reader.readAsDataURL(f);
                }
            });
            render();
        });

        render();
    });
})();
