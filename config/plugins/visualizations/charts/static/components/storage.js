/** This class saves and loads a chart through the api. */
define( [ 'utils/utils', 'mvc/ui/ui-modal', 'plugin/components/model', 'mvc/visualization/visualization-model' ], function( Utils, Modal, Chart ) {
    return Backbone.Model.extend({

        initialize: function( chart, types, options ) {
            this.chart      = chart;
            this.options    = options;
            this.id         = options.id;
            this.types      = types;
            this.modal      = parent.Galaxy && parent.Galaxy.modal || new Modal.View();
            this.vis = new Visualization({
                id      : this.id,
                type    : 'charts',
                config  : {
                    dataset_id  : this.options.config.dataset_id,
                    chart_dict  : {}
                }
            });
            var chart_dict = this.options.config.chart_dict;
            if ( chart_dict ) {
                this.vis.get( 'config' ).chart_dict = chart_dict;
            }
        },

        /** Pack and save nested chart model */
        save: function() {
            var self = this;
            var chart = this.chart;
            var chart_dict = {
                attributes : chart.attributes,
                settings   : chart.settings.attributes,
                groups     : []
            };
            chart.groups.each( function( group ) {
                chart_dict.groups.push( group.attributes );
            });
            this.vis.set( 'title', chart.get( 'title' ) || '' );
            this.vis.get( 'config' ).chart_dict = chart_dict;
            this.vis.save()
                    .fail(function( xhr, status, message ) {
                        this.modal.show( { title: 'Saving failed.', body: 'An attempt to save this chart to the server failed. Please try again and contact the administrator.', buttons: { 'Close': function() { self.modal.hide() } } } );
                    })
                    .then( function( response ) {
                        if ( response && response.id ) {
                            self.id = response.id;
                        } else {
                            console.debug( 'Storage::save() - Unrecognized response. Saving may have failed.' );
                        }
                    });
        },

        /** Load nested models/collections from packed dictionary */
        load: function() {
            var chart_dict = this.vis.get( 'config' ).chart_dict;
            if ( !chart_dict.attributes ) {
                console.debug( 'Storage::load() - Chart attributes not found. Invalid format.' );
                return false;
            }
            var chart_type = chart_dict.attributes[ 'type' ];
            if ( !chart_type ) {
                console.debug( 'Storage::load() - Chart type not provided. Invalid format.' );
                return false;
            }
            var chart_definition = this.types[ chart_type ];
            if ( !chart_definition ) {
                console.debug( 'Storage::load() - Chart type not supported. Please re-configure the chart.' );
                return false;
            }
            this.chart.definition = chart_definition;
            this.chart.set( chart_dict.attributes );
            this.chart.state( 'ok', 'Loading saved visualization...' );
            this.chart.settings.set( chart_dict.settings );
            this.chart.groups.reset();
            this.chart.groups.add( chart_dict.groups );
            this.chart.set( 'modified', false );
            console.debug( 'Storage::load() - Loading chart type ' + chart_type + '.' );
            return true;
        }
    });
});