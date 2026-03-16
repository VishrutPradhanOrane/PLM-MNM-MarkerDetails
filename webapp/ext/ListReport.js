sap.ui.define([
  "sap/ui/core/mvc/ControllerExtension",
  "sap/m/MessageToast"
], function (ControllerExtension, MessageToast) {
  "use strict";

  return ControllerExtension.extend("markerdetails.markerdetails.ext.ListReport", {
    metadata: {
      methods: {
        onAfterRendering: {
          public: true,
          final: false
        }
      }
    },

    onInit: function () {
      console.log("[ListReport] onInit FIRED");
      this.base.onInit();
      
      var that = this;
      // Use a timeout to ensure table is rendered
      setTimeout(function () {
        that._initializeUploadButtons();
      }, 100);
    },

    /**
     * Alternative init that overrides table rendering
     */
    onAfterRendering: function () {
      console.log("[ListReport] onAfterRendering FIRED");
      this.base.onAfterRendering();
      
      var that = this;
      setTimeout(function () {
        that._initializeUploadButtons();
      }, 200);
    },

    /**
     * Initialize upload button injection
     */
    _initializeUploadButtons: function () {
      console.log("[ListReport] _initializeUploadButtons called");
      
      var that = this;
      
      // Immediate first pass
      that._addUploadButtonsToEmptyCells();
      
      // Then set up observer for dynamic additions
      setTimeout(function () {
        that._startTableObserver();
      }, 500);
    },

    /**
     * Start observing table for new rows
     */
    _startTableObserver: function () {
      console.log("[ListReport] Setting up table observer");
      
      var that = this;
      var oTableContainer = document.querySelector("[role='grid']");

      if (!oTableContainer) {
        console.log("[ListReport] Grid table not found, will retry");
        setTimeout(function () {
          that._startTableObserver();
        }, 1000);
        return;
      }

      console.log("[ListReport] Grid table found, starting observer");

      var oConfig = {
        childList: true,
        subtree: true,
        characterData: false,
        attributes: false
      };

      var oObserver = new MutationObserver(function (mutations) {
        if (!that._debounceTimer) {
          that._debounceTimer = setTimeout(function () {
            console.log("[ListReport] Mutation detected, re-scanning cells");
            that._addUploadButtonsToEmptyCells();
            that._debounceTimer = null;
          }, 300);
        }
      });

      try {
        oObserver.observe(oTableContainer, oConfig);
        console.log("[ListReport] Observer activated successfully");
      } catch (e) {
        console.error("[ListReport] Observer error:", e);
      }
    },

    /**
     * Find all empty attachment cells and add buttons
     */
    _addUploadButtonsToEmptyCells: function () {
      console.log("[ListReport] _addUploadButtonsToEmptyCells scanning...");
      
      var aCells = document.querySelectorAll("[role='gridcell']");
      console.log("[ListReport] Found " + aCells.length + " gridcells total");
      
      var iAdded = 0;
      var iSkipped = 0;

      aCells.forEach(function (oCell, iIndex) {
        // Skip if already has button
        if (oCell.querySelector("[data-upload-btn='true']")) {
          iSkipped++;
          return;
        }

        var sText = (oCell.textContent || "").trim();
        
        // Look for empty cells (shown as "-")
        if (sText === "-" || sText === "") {
          try {
            this._addButtonToCell(oCell);
            iAdded++;
          } catch (e) {
            console.error("[ListReport] Error with cell:", e);
          }
        }
      }.bind(this));

      console.log("[ListReport] Added: " + iAdded + ", Skipped: " + iSkipped);
    },

    /**
     * Add upload button to a cell
     */
    _addButtonToCell: function (oCell) {
      var sContent = oCell.textContent;

      var sHTML = `<div style="display:flex; align-items:center; gap:8px; width:100%;">
        <span>${sContent}</span>
        <button data-upload-btn="true" type="button" style="background-color:#0a6ed4; color:white; 
                border:none; border-radius:4px; padding:4px 8px; font-size:11px; cursor:pointer; 
                white-space:nowrap; flex-shrink:0;">Upload</button>
      </div>`;

      oCell.innerHTML = sHTML;

      var oBtn = oCell.querySelector("[data-upload-btn]");
      var that = this;
      
      if (oBtn) {
        oBtn.onclick = function (e) {
          e.stopPropagation();
          e.preventDefault();
          console.log("[ListReport] Upload button clicked");
          MessageToast.show("Upload dialog will open");
        };

        oBtn.onmouseover = function () {
          this.style.backgroundColor = "#0856ba";
        };

        oBtn.onmouseout = function () {
          this.style.backgroundColor = "#0a6ed4";
        };
      }
    }
  });
});

