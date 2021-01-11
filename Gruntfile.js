module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            task1: {
                expand: true,
                cwd: "./node_modules/uikit/dist/js/",
                src: "*.js",
                dest: "./src/libs-js"
            } ,
            task2: {
                expand: true,
                cwd: "./node_modules/file-saver/src/",
                src: "*.js",
                dest: "./src/libs-js"
            },
            task3: {
                expand: true,
                cwd: "./node_modules/psl/dist/",
                src: "*.js",
                dest: "./src/libs-js"
            },
            task4: {
                expand: true,
                cwd: "./node_modules/tippy.js/dist/",
                src: "*.js",
                dest: "./src/libs-js"
            },
            task5: {
                expand: true,
                cwd: "./node_modules/@popperjs/core/dist/umd/",
                src: "*.js",
                dest: "./src/libs-js"
            },
            task6: {
                expand: true,
                cwd: "./node_modules/mustache",
                src: "*.js",
                dest: "./src/libs-js"
            }, 
            task7: {
                expand: true,
                cwd: "./node_modules/dark-mode-switch",
                src: "*.js",
                dest: "./src/libs-js"
            },
            task8: {
                expand: true,
                cwd: "./node_modules/dark-mode-switch",
                src: "*.css",
                dest: "./src/libs-css"
            },
            task9: {
                expand: true,
                cwd: "./node_modules/uikit/dist/css/",
                src: "*.css",
                dest: "./src/libs-css"
            },
            task10: {
                expand: true,
                cwd: "./node_modules/animate.css/",
                src: "*.css",
                dest: "./src/libs-css"
            },
                     

        },
    })
    
    grunt.registerTask('default', ['copy']);

}