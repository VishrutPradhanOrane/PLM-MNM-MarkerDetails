sap.ui.define([
  "sap/m/MessageToast",
  "sap/ui/unified/FileUploader",
  "sap/m/Dialog",
  "sap/m/Button",
  "sap/m/VBox",
  "sap/m/Text",
  "sap/ui/core/BusyIndicator",
  "sap/ui/core/mvc/Controller"
], function (MessageToast, FileUploader, Dialog, Button, VBox, Text, BusyIndicator, Controller) {
  "use strict";

  return {
    /**
     * Handle PDF upload for Marker Attachment field
     *
     * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
     * @param aSelectedContexts the selected contexts of the table rows.
     */
    UploadMarker: function (oContext, aSelectedContexts) {
      var that = this;
      var oModel;

      // Get the upload model
      if (this.getModel) {
        oModel = this.getModel("uploadModel");
      } else if (this.getView) {
        oModel = this.getView().getModel("uploadModel");
      }

      if (!oModel) {
        MessageToast.show("Error: Could not get uploadModel");
        console.error("UploadMarker context error:", this);
        return;
      }

      // Create FileUploader control
      var oFileUploader = new FileUploader({
        buttonOnly: true,
        buttonText: "Choose PDF",
        name: "attachmentFile",
        accept: ".pdf",
        change: function (oEvent) {
          var oFile = oEvent.getParameter("files")[0];
          
          if (!oFile) {
            MessageToast.show("No file selected");
            return;
          }

          // Validate file type
          if (oFile.type !== "application/pdf") {
            MessageToast.show("Please select a valid PDF file");
            return;
          }

          // Validate file size (max 50MB)
          if (oFile.size > 50 * 1024 * 1024) {
            MessageToast.show("File size exceeds 50MB limit");
            return;
          }

          // Show filename in dialog
          oFileNameText.setText("Selected: " + oFile.name);
          that._selectedFile = oFile;
        }
      });

      // Create text to display selected filename
      var oFileNameText = new Text({
        text: "No file selected",
        class: "sapUiMediumMarginTop"
      });

      // Create upload button
      var oUploadButton = new Button({
        text: "Upload",
        type: "Success",
        press: function () {
          if (!that._selectedFile) {
            MessageToast.show("Please select a PDF file first");
            return;
          }

          // Upload the file
          that._uploadFile(oModel, that._selectedFile, oFileUploader, oDialog);
        }
      });

      // Create cancel button
      var oCancelButton = new Button({
        text: "Cancel",
        press: function () {
          oDialog.close();
        }
      });

      // Create content
      var oVBox = new VBox({
        items: [
          new Text({ text: "Upload PDF to Marker Attachment", class: "sapUiMediumMarginBottom" }),
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

      // Create dialog
      var oDialog = new Dialog({
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
     * Handle upload button press from row action (inline button per row)
     * Called from DataFieldForAction in annotation
     */
    onRowUploadPress: function (oEvent) {
      // Fiori Elements passes context via 'contexts' parameter
      var aContexts = oEvent.getParameter("contexts");
      var oContext = aContexts && aContexts.length > 0 ? aContexts[0] : null;
      
      // If context not available through parameter, try to get it from event source
      if (!oContext) {
        var oSource = oEvent.getSource && oEvent.getSource();
        oContext = oSource && oSource.getBindingContext ? oSource.getBindingContext() : null;
      }

      if (!oContext) {
        MessageToast.show("Error: Could not get row context");
        console.error("No context available in onRowUploadPress");
        return;
      }

      var oRowData = oContext.getObject();
      this._uploadAttachmentForRow(oRowData, oContext);
    },

    /**
     * Global upload handler for any context - can be called from ListReport extension
     */
    uploadAttachmentForRow: function (oRowData, oContext) {
      this._uploadAttachmentForRow(oRowData, oContext);
    },

    /**
     * Upload attachment for a specific row
     */
    _uploadAttachmentForRow: function (oRowData, oContext) {
      var that = this;
      var oModel = oContext.getModel("uploadModel");
      
      // If model not found via context, try to get from controller
      if (!oModel && this.getOwnerComponent) {
        oModel = this.getOwnerComponent().getModel("uploadModel");
      }
      
      // Final fallback - try via getModel if this is a controller
      if (!oModel && this.getModel) {
        oModel = this.getModel("uploadModel");
      }

      if (!oModel) {
        MessageToast.show("Error: Could not access upload service");
        console.error("uploadModel not available");
        return;
      }

      // Create FileUploader control
      var oFileUploader = new FileUploader({
        buttonOnly: true,
        buttonText: "Choose PDF",
        name: "attachmentFile",
        accept: ".pdf",
        change: function (oEvent) {
          var oFile = oEvent.getParameter("files")[0];
          
          if (!oFile) {
            MessageToast.show("No file selected");
            return;
          }

          // Validate file type
          if (oFile.type !== "application/pdf") {
            MessageToast.show("Please select a valid PDF file");
            return;
          }

          // Validate file size (max 50MB)
          if (oFile.size > 50 * 1024 * 1024) {
            MessageToast.show("File size exceeds 50MB limit");
            return;
          }

          // Show filename in dialog
          oFileNameText.setText("Selected: " + oFile.name);
          that._selectedFile = oFile;
        }
      });

      // Create text to display selected filename
      var oFileNameText = new Text({
        text: "No file selected",
        class: "sapUiMediumMarginTop"
      });

      // Create upload button
      var oUploadButton = new Button({
        text: "Upload",
        type: "Success",
        press: function () {
          if (!that._selectedFile) {
            MessageToast.show("Please select a PDF file first");
            return;
          }

          // Upload the file
          that._uploadFileForRow(oModel, that._selectedFile, oRowData, oContext, oFileUploader, oDialog);
        }
      });

      // Create cancel button
      var oCancelButton = new Button({
        text: "Cancel",
        press: function () {
          oDialog.close();
        }
      });

      // Create content
      var oVBox = new VBox({
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

      // Create dialog
      var oDialog = new Dialog({
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
     * Upload file to OData service
     */
    _uploadFile: function (oModel, oFile, oFileUploader, oDialog) {
      BusyIndicator.show(0);
      var that = this;
      var oReader = new FileReader();

      oReader.onload = function (e) {
        var aBytes = new Uint8Array(e.target.result);
        var sBase64 = btoa(String.fromCharCode.apply(null, aBytes));

        var oPayload = {
          Filename: oFile.name,
          Filetype: oFile.type,
          Filesize: oFile.size.toString(),
          FileContent: sBase64
        };

        oModel.create("/UploadSet", oPayload, {
          success: function (oData, response) {
            BusyIndicator.hide();
            MessageToast.show("File uploaded successfully: " + oFile.name);
            console.log("Upload Service Response:", oData, response);
            oDialog.close();
          },
          error: function (oError) {
            BusyIndicator.hide();
            console.error("Upload Service Error:", oError);
            var sMsg = "Error uploading file";
            try {
              sMsg = JSON.parse(oError.responseText).error.message.value;
            } catch (e) {
              sMsg = oError.message || oError.statusText;
            }
            MessageToast.show("Failed to upload: " + sMsg);
          }
        });
      };

      oReader.onerror = function () {
        BusyIndicator.hide();
        MessageToast.show("Error reading file");
      };

      oReader.readAsArrayBuffer(oFile);
    },

    /**
     * Upload file to OData service for a specific row
     */
    _uploadFileForRow: function (oModel, oFile, oRowData, oContext, oFileUploader, oDialog) {
      BusyIndicator.show(0);
      var that = this;
      var oReader = new FileReader();

      oReader.onload = function (e) {
        var aBytes = new Uint8Array(e.target.result);
        var sBase64 = btoa(String.fromCharCode.apply(null, aBytes));

        var oPayload = {
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
            console.log("Upload Service Response:", oData, response);
            oDialog.close();
          },
          error: function (oError) {
            BusyIndicator.hide();
            console.error("Upload Service Error:", oError);
            var sMsg = "Error uploading file";
            try {
              sMsg = JSON.parse(oError.responseText).error.message.value;
            } catch (e) {
              sMsg = oError.message || oError.statusText;
            }
            MessageToast.show("Failed to upload: " + sMsg);
          }
        });
      };

      oReader.onerror = function () {
        BusyIndicator.hide();
        MessageToast.show("Error reading file");
      };

      oReader.readAsArrayBuffer(oFile);
    }
  };
});
