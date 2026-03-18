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

  var UPLOAD_URL = "/sap/opu/odata/sap/ZMARKER_UPLOAD_SRV/UploadSet";

  function postUploadPayload(oPayload, oFile, oDialog) {
    var oHeaders = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    };

    console.log("[UploadMarker] ===== FULL REQUEST PAYLOAD =====");
    console.log("  URL:", UPLOAD_URL);
    console.log("  Method: POST");
    console.log("  Content-Type: application/json");
    console.log("  --- BODY (JSON) ---");
    console.log(JSON.stringify(oPayload, null, 2));
    console.log("[UploadMarker] ===== END PAYLOAD =====");

    return fetch(UPLOAD_URL, {
      method: "POST",
      headers: oHeaders,
      credentials: "same-origin",
      body: JSON.stringify(oPayload)
    })
      .then(function (response) {
        return response.text().then(function (sBodyText) {
          return {
            ok: response.ok,
            status: response.status,
            body: sBodyText
          };
        });
      })
      .then(function (result) {
        BusyIndicator.hide();
        if (result.ok) {
          MessageToast.show("File uploaded successfully: " + oFile.name);
          console.log("[UploadMarker] Upload success:", result.body);
          oDialog.close();
          return;
        }

        console.error("[UploadMarker] Upload error:", result.status, result.body);
        var sMsg = "Upload failed: " + result.status;

        try {
          var oParser = new DOMParser();
          var oDoc = oParser.parseFromString(result.body, "text/xml");
          var oMsgNode = oDoc.getElementsByTagName("message")[0];
          if (oMsgNode) {
            sMsg = oMsgNode.textContent;
          }
        } catch (ex) {
          try {
            sMsg = JSON.parse(result.body).error.message.value;
          } catch (ex2) {
            sMsg = "Upload failed: " + result.status;
          }
        }

        MessageToast.show(sMsg);
      })
      .catch(function (oError) {
        BusyIndicator.hide();
        console.error("[UploadMarker] Fetch error:", oError);
        MessageToast.show("Upload failed: " + (oError && oError.message ? oError.message : "Unknown error"));
      });
  }

  function uploadFile(oModel, oFile, sFilePath, oDialog) {
    BusyIndicator.show(0);
    var oReader = new FileReader();

    oReader.onload = function (e) {
      var aBytes = new Uint8Array(e.target.result);
      var sBase64 = btoa(String.fromCharCode.apply(null, aBytes));

      var oPayload = {
        Slug: {
          filepath: sFilePath || oFile.name,
          filename: oFile.name,
          fabricno: "",
          size: "",
          styleid: ""
        },
        pdfdata: sBase64
      };

      postUploadPayload(oPayload, oFile, oDialog);
    };

    oReader.onerror = function () {
      BusyIndicator.hide();
      MessageToast.show("Error reading file");
    };

    oReader.readAsArrayBuffer(oFile);
  }

  function uploadFileForRow(oModel, oFile, oRowData, sFilePath, oDialog) {
    BusyIndicator.show(0);
    var oReader = new FileReader();

    oReader.onload = function (e) {
      var aBytes = new Uint8Array(e.target.result);
      var sBase64 = btoa(String.fromCharCode.apply(null, aBytes));

      var oPayload = {
        Slug: {
          filepath: sFilePath || oFile.name,
          filename: oFile.name,
          fabricno: oRowData && oRowData.FabricNo ? oRowData.FabricNo : "",
          size: oRowData && oRowData.ArticleSize ? String(oRowData.ArticleSize) : "",
          styleid: oRowData && oRowData.Styleid ? oRowData.Styleid : ""
        },
        pdfdata: sBase64
      };

      postUploadPayload(oPayload, oFile, oDialog);
    };

    oReader.onerror = function () {
      BusyIndicator.hide();
      MessageToast.show("Error reading file");
    };

    oReader.readAsArrayBuffer(oFile);
  }

  return {
    /**
     * Handle PDF upload for Marker Attachment field
     *
     * @param oContext the context of the page on which the event was fired. `undefined` for list report page.
     * @param aSelectedContexts the selected contexts of the table rows.
     */
    UploadMarker: function (oContext, aSelectedContexts) {
      var oModel;
      var oSelectedFile = null;
      var sSelectedFilePath = "";
      var oTargetContext = null;
      var oRowData = null;

      if (aSelectedContexts && aSelectedContexts.length > 0) {
        oTargetContext = aSelectedContexts[0];
      } else if (oContext) {
        oTargetContext = oContext;
      }

      if (aSelectedContexts && aSelectedContexts.length > 1) {
        MessageToast.show("Multiple rows selected. Upload will use the first selected row.");
      }

      if (oTargetContext && oTargetContext.getObject) {
        oRowData = oTargetContext.getObject();
      }

      // Get the upload model
      if (this.getModel) {
        oModel = this.getModel("uploadModel");
      } else if (this.getView) {
        oModel = this.getView().getModel("uploadModel");
      }

      if (!oModel && oTargetContext && oTargetContext.getModel) {
        oModel = oTargetContext.getModel("uploadModel");
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
          oSelectedFile = oFile;
          sSelectedFilePath = oEvent.getSource && oEvent.getSource().getValue ? oEvent.getSource().getValue() : oFile.name;
        }
      });

      // Create text to display selected filename
      var oFileNameText = new Text({
        text: "No file selected"
      });
      oFileNameText.addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom");

      // Create upload button
      var oUploadButton = new Button({
        text: "Upload",
        type: "Success",
        press: function () {
          if (!oSelectedFile) {
            MessageToast.show("Please select a PDF file first");
            return;
          }

          // Upload the file
          if (oRowData && oRowData.Styleid) {
            uploadFileForRow(oModel, oSelectedFile, oRowData, sSelectedFilePath, oDialog);
          } else {
            MessageToast.show("Selected row is missing Styleid. Cannot upload marker attachment.");
          }
        }
      });

      // Create cancel button
      var oCancelButton = new Button({
        text: "Cancel",
        press: function () {
          oDialog.close();
        }
      });

      oFileUploader.addStyleClass("sapUiTinyMarginTop sapUiSmallMarginBottom");

      // Create content
      var oIntroText = new Text({ text: "Upload a PDF file for the selected marker." });
      oIntroText.addStyleClass("sapUiTinyMarginBottom");

      var oHintText = new Text({ text: "Only PDF files are allowed. Maximum size: 50 MB." });
      oHintText.addStyleClass("sapUiTinyMarginBottom sapUiSmallMarginTop");

      var oVBox = new VBox({
        items: [
          oIntroText,
          oHintText,
          oFileUploader,
          oFileNameText
        ]
      });
      oVBox.addStyleClass("sapUiMediumMargin sapUiResponsiveContentPadding");

      // Create dialog
      var oDialog = new Dialog({
        title: "Upload PDF Attachment",
        contentWidth: "30rem",
        draggable: true,
        resizable: true,
        content: [oVBox],
        beginButton: oUploadButton,
        endButton: oCancelButton,
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
      var oModel = oContext.getModel("uploadModel");
      var oSelectedFile = null;
      var sSelectedFilePath = "";
      
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
          oSelectedFile = oFile;
          sSelectedFilePath = oEvent.getSource && oEvent.getSource().getValue ? oEvent.getSource().getValue() : oFile.name;
        }
      });

      // Create text to display selected filename
      var oFileNameText = new Text({
        text: "No file selected"
      });
      oFileNameText.addStyleClass("sapUiSmallMarginTop sapUiTinyMarginBottom");

      // Create upload button
      var oUploadButton = new Button({
        text: "Upload",
        type: "Success",
        press: function () {
          if (!oSelectedFile) {
            MessageToast.show("Please select a PDF file first");
            return;
          }

          // Upload the file
          uploadFileForRow(oModel, oSelectedFile, oRowData, sSelectedFilePath, oDialog);
        }
      });

      // Create cancel button
      var oCancelButton = new Button({
        text: "Cancel",
        press: function () {
          oDialog.close();
        }
      });

      oFileUploader.addStyleClass("sapUiTinyMarginTop sapUiSmallMarginBottom");

      // Create content
      var oMarkerText = new Text({
        text: "Marker: " + (oRowData.StyleCode || oRowData.Styleid || "Selected row")
      });
      oMarkerText.addStyleClass("sapUiTinyMarginBottom");

      var oHintText = new Text({ text: "Select a PDF file (max 50 MB) and click Upload." });
      oHintText.addStyleClass("sapUiTinyMarginBottom sapUiSmallMarginTop");

      var oVBox = new VBox({
        items: [
          oMarkerText,
          oHintText,
          oFileUploader,
          oFileNameText
        ]
      });
      oVBox.addStyleClass("sapUiMediumMargin sapUiResponsiveContentPadding");

      // Create dialog
      var oDialog = new Dialog({
        title: "Upload PDF Attachment",
        contentWidth: "30rem",
        draggable: true,
        resizable: true,
        content: [oVBox],
        beginButton: oUploadButton,
        endButton: oCancelButton,
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
      var sFilePath = oFileUploader && oFileUploader.getValue ? oFileUploader.getValue() : oFile.name;
      uploadFile(oModel, oFile, sFilePath, oDialog);
    },

    /**
     * Upload file to OData service for a specific row
     */
    _uploadFileForRow: function (oModel, oFile, oRowData, oContext, oFileUploader, oDialog) {
      var sFilePath = oFileUploader && oFileUploader.getValue ? oFileUploader.getValue() : oFile.name;
      uploadFileForRow(oModel, oFile, oRowData, sFilePath, oDialog);
    }
  };
});
