sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'markerdetails.markerdetails',
            componentId: 'ZC_stl_marker_dlList',
            contextPath: '/ZC_stl_marker_dl'
        },
        CustomPageDefinitions
    );
});