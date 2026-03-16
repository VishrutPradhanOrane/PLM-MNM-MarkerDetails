import BaseComponent from "sap/fe/core/AppComponent";

/**
 * @namespace markerdetails.markerdetails
 */
export default class Component extends BaseComponent {

	public static metadata = {
		manifest: "json"
	};

	public init(): void {
		super.init();
		this._initializeUploadButtons();
	}

	/**
	 * Initialize upload button injection
	 */
	private _initializeUploadButtons(): void {
		const that = this;
		let iAttempts = 0;
		const iMaxAttempts = 30; // Try for 15 seconds (500ms * 30)

		const oTimer = setInterval(() => {
			iAttempts++;
			console.log("[MarkerDetails] Upload button injection attempt " + iAttempts);

			if (that._injectUploadButtons()) {
				clearInterval(oTimer);
				console.log("[MarkerDetails] Upload buttons injected successfully!");
			} else if (iAttempts >= iMaxAttempts) {
				clearInterval(oTimer);
				console.log("[MarkerDetails] Could not inject upload buttons after " + iMaxAttempts + " attempts");
			}
		}, 500);
	}

	/**
	 * Inject upload buttons into table cells
	 */
	private _injectUploadButtons(): boolean {
		try {
			const aCells = document.querySelectorAll("[role='gridcell']");
			
			if (!aCells || aCells.length === 0) {
				console.log("[MarkerDetails] No grid cells found yet");
				return false;
			}

			let iButtonsAdded = 0;

			aCells.forEach((oCell: any) => {
				const sText = (oCell.textContent || "").trim();
				
				// Skip if already has button or is not an attachment cell
				if (oCell.querySelector("[data-upload-btn]")) {
					return;
				}

				// Look for attachment column cells (showing "-")
				if (sText === "-" || sText === "") {
					try {
						this._enhanceCell(oCell);
						iButtonsAdded++;
					} catch (e) {
						console.log("[MarkerDetails] Error enhancing cell:", (e as Error).message);
					}
				}
			});

			if (iButtonsAdded > 0) {
				console.log("[MarkerDetails] Enhanced " + iButtonsAdded + " cells with upload buttons");
				return true;
			}

			return false;

		} catch (e) {
			console.error("[MarkerDetails] Error in _injectUploadButtons:", (e as Error).message);
			return false;
		}
	}

	/**
	 * Add upload button to a single cell
	 */
	private _enhanceCell(oCell: any): void {
		const sContent = oCell.innerHTML;

		const sNewHTML =
			'<div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">' +
			'  <span style="flex: 1;">' + sContent + '</span>' +
			'  <button data-upload-btn="true" type="button" title="Upload PDF" ' +
			'          style="padding: 4px 8px; white-space: nowrap; flex-shrink: 0; cursor: pointer;" ' +
			'          class="sapMBtn sapMBtnSmall sapMBtnBase sapMBtnEmphasized">' +
			'    <span style="margin-right: 4px;">⬆</span>Upload' +
			'  </button>' +
			'</div>';

		oCell.innerHTML = sNewHTML;

		const oButton = oCell.querySelector("[data-upload-btn]");
		if (oButton) {
			oButton.addEventListener("click", (e: Event) => {
				e.stopPropagation();
				e.preventDefault();
				console.log("[MarkerDetails] Upload button clicked!");
				alert("Upload button clicked! Dialog will open soon.");
			});
		}
	}
}