# Mercurial Charts

Generates Git style contribution graphs for mercurial repositories. 

## How does it work?

Essentially generates json from mercurial commit history. The generated json then becomes series data for highchart graphs. The json files are then loaded by a static Bootstrap/jQuery html page.

## Usage

### Quick start

> assumes you have already generated a source file using hg log template, see below.

    $ python mercurial-charts.py -s /path/to/source
    $ cd web; python -m SimpleHTTPServer 9999
    # open http://localhost:9999 in browser

### Generate a source file
Generate a source file using mercurial

    $ hg log -r "sort(all(),date)" --template '{rev},{branch},{node|short},{date|shortdate},{date|isodate},{diffstat},{author|email}\n'

To make things easier add this to your ~/.hgrc file

    $ vi ~/.hgrc
    [alias]
    contrib = log -r "sort(all(),date)" --template '{rev},{branch},{node|short},{date|shortdate},{date|isodate},{diffstat},{author|email}\n'

Then you can issue the following and filter as necessary

    # all contributions
    $ hg contrib > contrib-source.txt 

    # all contributions by specific users
    $ hg contrib --user user1 --user user2  > contrib-source.txt 

    # all contributions without merges
    $ hg contrib --no-merges > contrib-source.txt 

    # all contributions to default branch without merges
    $ hg contrib --no-merges -b default > contrib-source.txt 

## Aliases

If like me you have a few commits where the username is either incorrect or you would simply like to combine several users into a single chart you can create an alias file.

    # Example alias file
    #hgusername=alias
    mweston=matt.weston
    hg=unattributed
    developers=unattributed

After you have your alias file use the -a switch when running mercurial-charts.py

Example: Without alias file mercurial-charts generates the following profiles

    $ python mercurial-charts.py -s datasource/example-repo.txt
    Generated json from mercurial log files
    Source File: datasource/example-repo.txt
    Output Directory: web/json
    
    Profile Summary:
    ['matt.weston', 'd41d8cd98f00b204e9800998ecf8427e', 994, 1131763, -1108108]
    ['mweston', 'd41d8cd98f00b204e9800998ecf8427e', 4, 143, -44]
    ['developers', 'd41d8cd98f00b204e9800998ecf8427e', 326, 288350, -49619]
    ['all.contributions', 'd41d8cd98f00b204e9800998ecf8427e', 1328, 1420762, -1158222]
    ['hg', 'd41d8cd98f00b204e9800998ecf8427e', 4, 506, -451]

After applying the alias file from the example above:

    $ python mercurial-charts.py -s datasource/example-repo.txt -a datasource/example-aliases.txt 
    Generated json from mercurial log files
    Source File: datasource/example-repo.txt
    Output Directory: web/json
    Aliases File: datasource/example-aliases.txt
    
    Profile Summary:
    ['matt.weston', 'd41d8cd98f00b204e9800998ecf8427e', 998, 1131906, -1108152]
    ['unattributed', 'd41d8cd98f00b204e9800998ecf8427e', 330, 288856, -50070]
    ['all.contributions', 'd41d8cd98f00b204e9800998ecf8427e', 1328, 1420762, -1158222]

## What does it look like?

Just a couple of example pics based on one of my local repositories.

### Commit Charts
![Alt text](https://bitbucket.org/mweston/mercurial-charts/raw/default/docs/commits.png)

### Diff Charts
![Alt text](https://bitbucket.org/mweston/mercurial-charts/raw/default/docs/diffs.png)

## What was it built with?

The project leverages a few things to make it work. Why? Because why reinvent things thats why.
 
- [Bootstrap](http://getbootstrap.com/)
- [jQuery](http://jquery.com/)
- [Highcharts](http://www.highcharts.com/)
- [Python](https://www.python.org/)

# License

The MIT License (MIT)

Copyright (c) [2015] [Matthew Weston]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

