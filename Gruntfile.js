/**
 * Created by Hege on 2014.11.08..
 */
module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        connect: {
            app: {
                options: {
                    port: 8080,
                    base: 'app',
                    keepalive: true
                }
            }
        }
    });

    grunt.registerTask('default', [ 'connect' ]);
};