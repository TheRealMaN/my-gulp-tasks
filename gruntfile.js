module.exports = function(grunt) {

// Project configuration.
  grunt.initConfig({

  db_dump: {
    options: {
      // common options should be defined here 
    },
    
    // "Local" target 
    "local": {
      "options": {
          "title": "Local DB",
        
          "database": "s2000996_mol",
          "user": "root",
          "pass": "root",
          "host": "localhost:3306",
          
          "backup_to": "backups/local.sql"
      }
    }
  }  

  });

// Load the plugin that provides task.
  grunt.loadNpmTasks('grunt-mysql-dump-import');

// Default task(s).
  grunt.registerTask('default', ['db_dump']);

};