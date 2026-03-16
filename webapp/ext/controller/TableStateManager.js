sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/unified/FileUploader",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/VBox",
  "sap/m/Text",
  "sap/ui/core/BusyIndicator"
], function (MessageToast, FileUploader, Dialog, Button, VBox, Text, BusyIndicator) {
  "use strict";

  return {
    /**
     * Extension hook for ListReport table - adds upload buttons to rows
     */
    overrideTableColumns: function (oTable) {
      try {
        if (oTable && oTable.getColumns) {
          const aColumns = oTable.getColumns();
          
          // Find the Filename/Attachment column
          for (let i = 0; i < aColumns.length; i++) {
            const oCol = aColumns[i];
            const oHeader = oCol.getLabel ? oCol.getLabel() : null;
            const sHeaderText = oHeader && oHeader.getText ? oHeader.getText() : "";
            
            if (sHeaderText.includes("Attachment") || sHeaderText.includes("Filename")) {
              // Add custom template with button
              const oTemplate = oCol.getTemplate ? oCol.getTemplate() : null;
              if (oTemplate) {
                this._enhanceColumnTemplate(oCol, oTable, i);
              }
              break;
            }
          }
        }
      } catch (e) {
        console.warn("Could not override table columns:", e);
      }
    },

    /**
     * Enhance a column template with upload button
     */
    _enhanceColumnTemplate: function (oCol, oTable, iColIndex) {
      try {
        const that = this;
        
        // Add click listener to cells in this column
        oTable.attachCellClick(function (oEvent) {
          const iColIdx = oEvent.getParameters().columnIndex;
          if (iColIdx === iColIndex) {
            const oRow = oEvent.getParameters().rowIndex;
            const oContext = oTable.getContextByIndex(oRow);
            if (oContext) {
              that._openUploadDialog(oContext);
            }
          }
        });
      } catch (e) {
        console.warn("Could not enhance column template:", e);
      }
    },

    /**
     * Open upload dialog for a specific row
     */
    _openUploadDialog: function (oContext) {
      const that = this;
      const oRowData = oContext.getObject();
      
      // Get upload model
      const oModel = oContext.getModel("uploadModel");
      if (!oModel) {
        MessageToast.show("Error: Upload service not available");
        return;
      }

      // Create FileUploader
      const oFileUploader = new FileUploader({
        buttonOnly: true,
        buttonText: "Choose PDF",
        name: "attachmentFile",
        accept: ".pdf",
        change: function (oEvent) {
          const oFile = oEvent.getParameter("files")[0];
          if (!oFile) {
            MessageToast.show("No file selected");
            return;
          }

          if (oFile.type !== "application/pdf") {
            MessageToast.show("Please select a valid PDF file");
            return;
          }

          if (oFile.size > 50 * 1024 * 1024) {
            MessageToast.show("File size exceeds 50MB limit");
            return;
          }

          oFileNameText.setText("Selected: " + oFile.name);
          that._selectedFile = oFile;
        }
      });

      const oFileNameText = new Text({
        text: "No file selected",
        class: "sapUiMediumMarginTop"
      });

      const oUploadButton = new Button({
        text: "Upload",
        type: "Success",
        press: function () {
          if (!that._selectedFile) {
            MessageToast.show("Please select a PDF file first");
            return;
          }

          that._performUpload(oModel, that._selectedFile, oRowData, oDialog);
        }
      });

      const oCancelButton = new Button({
        text: "Cancel",
        press: function () {
          oDialog.close();
        }
      });

      const oVBox = new VBox({
        items: [
          new Text({ 
            text: "Uploading for: " + (oRowData.StyleCode || "Marker"), 
            class: "sapUiMediumMarginBottom"
          }),
          new Text({ text: "Upload PDF to Attachment", class: "sapUiMediumMarginBottom" }),
          oFileUploader,
          oFileNameText,
          new VBox({
            items: [oUploadButton, oCancelButton],
            direction: "Row",
            class: "sapUiMediumMarginTop"
          }).addStyleClass("sapUiSmallMargin")
        ],
        class: "sapUiMediumMargin"
      });

      const oDialog = new Dialog({
        title: "Upload PDF Attachment",
        content: [oVBox],
        endButton: null,
        afterClose: function () {
          oDialog.destroy();
          oFileUploader.destroy();
        }
      });

      oDialog.open();
    },

    /**
     * Perform the actual file upload
     */
    _performUpload: function (oModel, oFile, oRowData, oDialog) {
      BusyIndicator.show(0);
      const that = this;
      const oReader = new FileReader();

      oReader.onload = function (e) {
        const aBytes = new Uint8Array(e.target.result);
        const sBase64 = btoa(String.fromCharCode.apply(null, aBytes));

        const oPayload = {
          Filename: oFile.name,
          Filetype: oFile.type,
          Filesize: oFile.size.toString(),
          FileContent: sBase64,
          MarkerID: oRowData.Styleid
        };

        oModel.create("/UploadSet", oPayload, {
          success: function (oData, response) {
            BusyIndicator.hide();
            MessageToast.show("File uploaded successfully: " + oFile.name);
            oDialog.close();
          },
          error: function (oError) {
            BusyIndicator.hide();
            console.error("Upload error:", oError);
            let sMsg = "Error uploading file";
            try {
              sMsg = JSON.parse(oError.responseText).error.message.value;
            } catch (e) {
              sMsg = oError.message || oError.statusText;
            }
            MessageToast.show("Failed: " + sMsg);
          }
        });
      };

      oReader.readAsArrayBuffer(oFile);
    }
  };
});
