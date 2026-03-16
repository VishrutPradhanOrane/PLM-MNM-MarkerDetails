sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'markerdetails/markerdetails/test/integration/FirstJourney',
		'markerdetails/markerdetails/test/integration/pages/ZC_stl_marker_dlList',
		'markerdetails/markerdetails/test/integration/pages/ZC_stl_marker_dlObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZC_stl_marker_dlList, ZC_stl_marker_dlObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('markerdetails/markerdetails') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZC_stl_marker_dlList: ZC_stl_marker_dlList,
					onTheZC_stl_marker_dlObjectPage: ZC_stl_marker_dlObjectPage
                }
            },
            opaJourney.run
        );
    }
);