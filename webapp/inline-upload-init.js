// Inline Upload Button Injector - Runs immediately on page load
(function() {
  'use strict';

  console.log('[InlineUploadInit] Script started');

  var iAttempts = 0;
  var iMaxAttempts = 60;
  var UPLOAD_URL = '/sap/opu/odata/sap/ZMARKER_UPLOAD_SRV/UploadSet';

  // ---- Upload logic ----

  function getFilterValue(sLabel) {
    // Try UI5 filter bar first
    if (typeof sap !== 'undefined' && sap.ui && sap.ui.getCore) {
      var aFilterBars = sap.ui.getCore().byFieldGroupId('').filter(function(c) {
        return c.isA && c.isA('sap.ui.mdc.FilterBar');
      });
      if (aFilterBars.length === 0) {
        // Try SmartFilterBar
        aFilterBars = sap.ui.getCore().byFieldGroupId('').filter(function(c) {
          return c.isA && c.isA('sap.ui.comp.filterbar.FilterBar');
        });
      }
    }

    // Fallback: read from DOM - find the filter label and its associated input
    var aLabels = document.querySelectorAll('label, span');
    for (var i = 0; i < aLabels.length; i++) {
      var txt = (aLabels[i].textContent || '').trim();
      if (txt === sLabel) {
        // Look for the nearest input/token container
        var oParent = aLabels[i].closest('.sapUiMdcFilterBarBaseContent, .sapMFilterItem, [class*="FilterField"], [class*="filterbar"]');
        if (!oParent) {
          oParent = aLabels[i].parentElement;
        }
        if (oParent) {
          // Check for multi-input tokens
          var aTokens = oParent.querySelectorAll('[class*="Token"] span, .sapMTokenText');
          if (aTokens.length > 0) {
            return (aTokens[0].textContent || '').trim();
          }
          // Check for input fields
          var oInput = oParent.querySelector('input[type="text"], input:not([type="hidden"])');
          if (oInput && oInput.value) {
            return oInput.value.trim();
          }
          // Check for spans with values
          var aSpans = oParent.querySelectorAll('span');
          for (var j = 0; j < aSpans.length; j++) {
            var sVal = (aSpans[j].textContent || '').trim();
            if (sVal && sVal !== sLabel && sVal !== '' && sVal.length > 1) {
              return sVal;
            }
          }
        }
      }
    }
    return '';
  }

  function getRowData(cell) {
    // Walk up to the table row element
    var row = cell.closest('[role="row"]');
    if (!row) return null;

    // Try to get data from SAPUI5 binding context
    var sRowId = row.getAttribute('id');
    if (sRowId && typeof sap !== 'undefined' && sap.ui && sap.ui.getCore) {
      var oRowControl = sap.ui.getCore().byId(sRowId);
      if (oRowControl) {
        var oCtx = oRowControl.getBindingContext();
        if (oCtx) {
          var oData = oCtx.getObject();
          if (oData) {
            return {
              FabricNo: oData.FabricNo || '',
              ArticleSize: oData.ArticleSize || '',
              Styleid: oData.Styleid || ''
            };
          }
        }
      }
    }

    // Fallback: read from visible grid cells using column header positions
    var cells = row.querySelectorAll('[role="gridcell"]');
    var headers = document.querySelectorAll('[role="columnheader"]');
    var fieldMap = {};
    headers.forEach(function(h, idx) {
      var txt = (h.textContent || '').trim();
      if (txt === 'Fabric No.') fieldMap.FabricNo = idx;
      if (txt === 'Article Size') fieldMap.ArticleSize = idx;
    });

    var data = { FabricNo: '', ArticleSize: '', Styleid: '' };
    if (fieldMap.FabricNo !== undefined && cells[fieldMap.FabricNo]) {
      data.FabricNo = (cells[fieldMap.FabricNo].textContent || '').trim();
    }
    if (fieldMap.ArticleSize !== undefined && cells[fieldMap.ArticleSize]) {
      data.ArticleSize = (cells[fieldMap.ArticleSize].textContent || '').trim();
    }
    // Get Styleid from filter bar "SAP Style No."
    data.Styleid = getFilterValue('SAP Style No.');
    console.log('[InlineUploadInit] Styleid from filter:', data.Styleid);
    return data;
  }

  var sAuthHeader = 'Basic ' + btoa('harshals:Harshal@123');

  function uploadPdf(file, rowData, sFilePath) {
    sap.ui.core.BusyIndicator.show(0);
    console.log('[InlineUploadInit] Starting upload for:', file.name);

    var oReader = new FileReader();
    oReader.onload = function(e) {
      var aBuffer = e.target.result;

      // Convert PDF binary to base64 string for SAP
      var aAllBytes = new Uint8Array(aBuffer);
      var sBinaryStr = '';
      for (var i = 0; i < aAllBytes.byteLength; i++) {
        sBinaryStr += String.fromCharCode(aAllBytes[i]);
      }
      var sPdfString = btoa(sBinaryStr);

      // Build JSON body
      var oPayload = {
        Slug: {
          filepath: sFilePath || file.name,
          filename: file.name,
          fabricno: rowData.FabricNo || '',
          size: rowData.ArticleSize || '',
          styleid: rowData.Styleid || ''
        },
        pdfdata: sPdfString
      };

      console.log('[InlineUploadInit] ===== FULL REQUEST PAYLOAD =====');
      console.log('  URL:', UPLOAD_URL);
      console.log('  Method: POST');
      console.log('  Content-Type: application/json');
      console.log('  --- BODY (JSON) ---');
      console.log(JSON.stringify(oPayload, null, 2));
      console.log('[InlineUploadInit] ===== END PAYLOAD =====');

      var oHeaders = {
        'Authorization': sAuthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };

      fetch(UPLOAD_URL, {
        method: 'POST',
        headers: oHeaders,
        body: JSON.stringify(oPayload)
      })
      .then(function(response) {
        console.log('[InlineUploadInit] Response status:', response.status);
        return response.text().then(function(text) {
          return { ok: response.ok, status: response.status, body: text };
        });
      })
      .then(function(result) {
        sap.ui.core.BusyIndicator.hide();
        if (result.ok) {
          sap.m.MessageToast.show('PDF uploaded successfully: ' + file.name);
          console.log('[InlineUploadInit] Upload success:', result.body);
        } else {
          console.error('[InlineUploadInit] Upload error:', result.status, result.body);
          var sMsg = 'Upload failed: ' + result.status;
          try {
            var oParser = new DOMParser();
            var oDoc = oParser.parseFromString(result.body, 'text/xml');
            var oMsgNode = oDoc.getElementsByTagName('message')[0];
            if (oMsgNode) sMsg = oMsgNode.textContent;
          } catch(ex) {
            try {
              var oParsed = JSON.parse(result.body);
              sMsg = oParsed.error.message.value;
            } catch(ex2) {}
          }
          sap.m.MessageToast.show(sMsg);
        }
      })
      .catch(function(err) {
        sap.ui.core.BusyIndicator.hide();
        console.error('[InlineUploadInit] Fetch error:', err);
        sap.m.MessageToast.show('Upload failed: ' + err.message);
      });
    };

    oReader.onerror = function() {
      sap.ui.core.BusyIndicator.hide();
      sap.m.MessageToast.show('Error reading file');
    };

    oReader.readAsArrayBuffer(file);
  }

  function handleUploadClick(cell) {
    var rowData = getRowData(cell);
    if (!rowData) {
      alert('Could not read row data');
      return;
    }
    console.log('[InlineUploadInit] Row data:', JSON.stringify(rowData));

    // Create hidden file input and trigger it
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,application/pdf';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    fileInput.addEventListener('change', function() {
      var file = fileInput.files[0];
      document.body.removeChild(fileInput);

      if (!file) return;

      if (file.type !== 'application/pdf') {
        alert('Please select a valid PDF file');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        alert('File size exceeds 50MB limit');
        return;
      }

      var sFilePath = fileInput.value || file.name;
      console.log('[InlineUploadInit] Uploading:', file.name, 'path:', sFilePath, 'for FabricNo:', rowData.FabricNo);
      uploadPdf(file, rowData, sFilePath);
    });

    fileInput.click();
  }

  // ---- DOM injection logic ----

  function injectButtons() {
    iAttempts++;

    var oAttachmentHeader = null;
    var aAllElements = document.querySelectorAll('span, div, td, th');
    var aHeaderCandidates = [];
    aAllElements.forEach(function(el) {
      var txt = (el.textContent || '').trim();
      if (txt === 'Attachment' && el.offsetWidth > 0) {
        aHeaderCandidates.push(el);
      }
    });

    if (aHeaderCandidates.length > 0) {
      oAttachmentHeader = aHeaderCandidates[0];
      var bestWidth = oAttachmentHeader.getBoundingClientRect().width;
      aHeaderCandidates.forEach(function(c) {
        var w = c.getBoundingClientRect().width;
        if (w > 50 && w < bestWidth) {
          oAttachmentHeader = c;
          bestWidth = w;
        }
      });
    }

    if (!oAttachmentHeader) {
      if (iAttempts < iMaxAttempts) {
        setTimeout(injectButtons, 500);
      }
      return;
    }

    var oHeaderRect = oAttachmentHeader.getBoundingClientRect();
    var fHeaderLeft = oHeaderRect.left;
    var fHeaderRight = oHeaderRect.right;

    var aCells = document.querySelectorAll('[role="gridcell"]');
    if (aCells.length === 0) {
      if (iAttempts < iMaxAttempts) {
        setTimeout(injectButtons, 500);
      }
      return;
    }

    var iAdded = 0;
    aCells.forEach(function(cell) {
      if (cell.querySelector('[data-inline-upload]')) {
        return;
      }

      var oCellRect = cell.getBoundingClientRect();
      var bOverlap = oCellRect.left < fHeaderRight && oCellRect.right > fHeaderLeft;
      if (!bOverlap) {
        return;
      }

      var sContent = (cell.textContent || '').trim();

      if (sContent === '' || sContent === '-' || sContent.indexOf('Empty Value') !== -1 || sContent.charAt(0) === '\u2013') {
        try {
          var sHTML = '<div style="display:flex;align-items:center;width:100%;justify-content:center;">' +
            '<button data-inline-upload type="button" style="' +
            'background-color:#0a6ed4;color:white;border:none;border-radius:3px;' +
            'padding:3px 8px;font-size:12px;cursor:pointer;white-space:nowrap;flex-shrink:0;' +
            'font-weight:500;transition:background-color 0.2s;' +
            '">\u2B06 Upload</button></div>';

          cell.innerHTML = sHTML;

          var btn = cell.querySelector('[data-inline-upload]');
          if (btn) {
            (function(targetCell) {
              btn.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                handleUploadClick(targetCell);
              });
            })(cell);
            btn.addEventListener('mouseover', function() {
              this.style.backgroundColor = '#0856ba';
            });
            btn.addEventListener('mouseout', function() {
              this.style.backgroundColor = '#0a6ed4';
            });
            iAdded++;
          }
        } catch(e) {
          console.error('[InlineUploadInit] Error:', e.message);
        }
      }
    });

    if (iAdded > 0) {
      console.log('[InlineUploadInit] Added ' + iAdded + ' upload buttons!');
    }

    if (iAttempts < iMaxAttempts) {
      setTimeout(injectButtons, iAttempts < 5 ? 500 : 2000);
    }
  }

  setTimeout(injectButtons, 500);
})();
