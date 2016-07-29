#!/usr/bin/env node

var program = require('commander');
var execSync = require('child_process').execSync;

var pluginWorkflowHelper = {
    npm: {
        packageJson: function () {
            return require('./package.json');
        },
        version: function () {
            return this.packageJson().version
        }
    },
    maven: {
        version: function () {
            var mavenVersionOutput = execSync('mvn org.apache.maven.plugins:maven-help-plugin:2.1.1:evaluate  -Dexpression=project.version -B', {
                encoding: 'utf-8',
                stdio: [0]
            });
            var mavenVersion = mavenVersionOutput.replace(/^(\[|Java).*(\n|$)/gm, '').trim();
            return mavenVersion;
        }
    },
    gitTags: function () {
        var gitTags = execSync('git tag -l', {encoding: 'utf-8'}).trim().split('\n');
        return gitTags;
    },
    searchVersionMatchInList: function (versionToCheck, versions) {
        for (var i = 0; i < versions.length; i++) {
            var version = versions[i];
            if (versionToCheck === version || version.endsWith(versionToCheck)) {
                return version;
            }
        }
    }
};

program
    .command('check')
    .description('Check inconsistencies between git tags and package versions (maven, npm)')
    .action(function (version) {
        var currentMavenVersion = pluginWorkflowHelper.maven.version();
        var currentNpmVersion = pluginWorkflowHelper.npm.version();
        var gitTags = pluginWorkflowHelper.gitTags();

        var mavenMatchingGitTag = pluginWorkflowHelper.searchVersionMatchInList(currentMavenVersion, gitTags);
        if (mavenMatchingGitTag) {
            console.error('Current maven version (%s) is already tagged (%s).', currentMavenVersion, mavenMatchingGitTag);
            console.error('Please, set a new development version.');
            process.exit(1);
        }

        var npmMatchingGitTag = pluginWorkflowHelper.searchVersionMatchInList(currentMavenVersion, gitTags);
        if (npmMatchingGitTag) {
            console.error('Current npm version (%s) is already tagged (%s).', currentNpmVersion, npmMatchingGitTag);
            console.error('Please, set a new development version.');
            process.exit(1);
        }
    });

program.parse(process.argv);

if (!program.args.length) {
    program.help();
}

