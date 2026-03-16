// Auto-inject upload buttons into attachment column cells
(function() {
  "use strict";

  console.log("[UploadInjector] Script loaded and ready");

  let iAttempts = 0;
  const iMaxAttempts = 30; // Try for ~15 seconds

  function injectUploadButtons() {
    try {
      const aCells = document.querySelectorAll("[role='gridcell']");
      
      if (!aCells || aCells.length === 0) {
        console.log("[UploadInjector] Attempt " + iAttempts + ": No gridcells found");
        return false;
      }

      let iButtonsAdded = 0;

      aCells.forEach(function(oCell) {
        const sText = (oCell.textContent || "").trim();
        
        // Skip if already has button
        if (oCell.querySelector("[data-upload-btn]")) {
          return;
        }

        // Look for attachment column cells (showing "-")
        if (sText === "-" || sText === "") {
          try {
            enhanceCell(oCell);
            iButtonsAdded++;
          } catch (e) {
            console.log("[UploadInjector] Error enhancing cell:", e.message);
          }
        }
      });

      if (iButtonsAdded > 0) {
        console.log("[UploadInjector] SUCCESS! Added " + iButtonsAdded + " upload buttons");
        return true;
      }

      return false;

    } catch (e) {
      console.error("[UploadInjector] Error in injectUploadButtons:", e.message);
      return false;
    }
  }

  function enhanceCell(oCell) {
    const sContent = oCell.innerHTML;

    const sNewHTML =
      '<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">' +
      '  <span style="flex: 1;">' + sContent + '</span>' +
      '  <button data-upload-btn="true" type="button" title="Upload PDF" ' +
      '          style="padding: 4px 8px; white-space: nowrap; flex-shrink: 0; cursor: pointer; background-color: #0a6ed4; color: white; border: none; border-radius: 4px; font-size: 12px;" ' +
      '          onmouseover="this.style.backgroundColor=\'#055ca4\'" ' +
      '          onmouseout="this.style.backgroundColor=\'#0a6ed4\'">' +
      '    <span style="margin-right: 4px;">⬆</span>Upload' +
      '  </button>' +
      '</div>';

    oCell.innerHTML = sNewHTML;

    const oButton = oCell.querySelector("[data-upload-btn]");
    if (oButton) {
      oButton.addEventListener("click", function(e) {
        e.stopPropagation();
        e.preventDefault();
        console.log("[UploadInjector] Upload button clicked!");
        // Get row data from parent row
        const oRow = oCell.closest("[role='row']");
        if (oRow) {
          console.log("[UploadInjector] Row:", oRow);
          alert("Upload button clicked! File upload dialog will open.");
        }
      });
    }
  }

  // Start injection attempts when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      console.log("[UploadInjector] DOMContentLoaded event fired");
      startInjectionAttempts();
    });
  } else {
    console.log("[UploadInjector] DOM already loaded");
    startInjectionAttempts();
  }

  function startInjectionAttempts() {
    const oTimer = setInterval(function() {
      iAttempts++;
      
      if (injectUploadButtons()) {
        clearInterval(oTimer);
      } else if (iAttempts >= iMaxAttempts) {
        clearInterval(oTimer);
        console.log("[UploadInjector] Stopped after " + iMaxAttempts + " attempts - table cells not found or no content");
      }
    }, 500);
  }

})();
