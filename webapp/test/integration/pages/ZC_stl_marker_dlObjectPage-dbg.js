sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'markerdetails.markerdetails',
            componentId: 'ZC_stl_marker_dlObjectPage',
            contextPath: '/ZC_stl_marker_dl'
        },
        CustomPageDefinitions
    );
});