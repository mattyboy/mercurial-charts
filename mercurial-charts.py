import json, datetime, hashlib, argparse

# parse script arguments
parser = argparse.ArgumentParser(description='Generates contributor json from mercurial log file')
parser.add_argument('-s', '--source', dest='source_file', nargs='?', required=True, 
                     type=argparse.FileType('r'), help='mercurial repository log file')
parser.add_argument('-a', '--aliases', dest='alias_file', nargs='?',  
                     type=argparse.FileType('r'), help='alias mercurial repository user names')
parser.add_argument('-o', '--output', dest='output_dir', default='web/json', help='output for generated json files')
args = parser.parse_args()

print 'Generated json from mercurial log files'
print 'Source File: {0}'.format(args.source_file.name)
print 'Output Directory: {0}'.format(args.output_dir)
if args.alias_file is not None:
  print 'Aliases File: {0}'.format(args.alias_file.name)
print ''

# cleans contributor name for files
def contrib_key(raw='unknown_contributor'):
  return raw.replace('.','_').replace(' ', '_')

# creates 3 json files per contributor
def series_open(contributor):
  key = contrib_key(contributor)
  file_open(key, 'commits', contributor) 
  file_open(key, 'additions', contributor) 
  file_open(key, 'deletions', contributor) 

def file_open(key, chart_type, contributor):
  filename = chart_type + '_' + key;
  file_path = "{0}/{1}.json".format(args.output_dir, filename)
  f = open(file_path, 'w')
  # using filename as javascript callback 
  f.write('{0}({{\n'.format(filename)) # open series
  f.write('  "contrib": "{0}",\n'.format(contributor))
  f.write('  "type": "{0}",\n'.format(chart_type)) 
  f.write('  "data": [\n') # open series data array
  open_files[filename] = f

def series_close():
  date = datetime.datetime.now().strftime('%Y-%m-%d')
  dummy_stat = '    [Date.parse("{0}"), {1}]\n'.format(date, 0)
  for key in open_files:
    f = open_files[key]
    f.write('  ]\n') # close series data array
    f.write('});\n') # close series
    f.close()

def write_profile():
  filename = "contrib"
  file_path = "{0}/{1}.json".format(args.output_dir, filename)
  f = open(file_path, 'w')
  f.write('contribs(')
  f.write(json.dumps(profiles))
  f.write(');')
  
  # write to python output
  print 'Profile Summary:'
  for key in profiles:
    print profiles[key]

def write_contributions(contributor, date, diffs):
  key = contrib_key(contributor)
  write_stat('commits_'+key, date, 1)
  write_stat('additions_'+key, date, diffs[0])
  write_stat('deletions_'+key, date, diffs[1])

def write_stat(key, x, y):
  f = open_files[key]
  data = '    [Date.parse("{0}"), {1}],\n'.format(x, y)
  f.write(data)

def add_contributor_totals(contributor, diff, email=''):
  key = contrib_key(contributor)
  # create file and profile if new contributor found
  if key not in profiles:
    series_open(contributor)
    gravatar = hashlib.md5(email.lower()).hexdigest()
    profiles[key] = [contributor, gravatar, 0, 0, 0]

  # keep tally of all contributions made by contributor for profile
  profiles[key][2] += 1
  profiles[key][3] += int(diff[0])
  profiles[key][4] += int(diff[1])


### PROGRAM STARTS HERE ###

# keep track of aliases, profiles and open files
aliases = {}
profiles = {}
open_files = {}

if args.alias_file is not None:
  with args.alias_file as f:
    for line in f:
      line = line.rstrip()
      if "=" not in line: continue
      if line.startswith("#"): continue
      k, v = line.split("=", 1)
      aliases[k] = v

with args.source_file as f:
  for line in f:
    # split hg log line by comma
    stats  =  line.rstrip().split(",")

    # date, diffstat and contributor
    date = stats[3]
    diffs = stats[5].split(':')[1].replace('+','').strip().split('/')
    email = stats[6]
    contributor = email.split('@')[0]
  
    # check if contributor has aliases
    if contributor in aliases:
      contributor = aliases[contributor]
   
    # null out email for unattributed
    if contributor == "unattributed":
      email = ""

    # create and update totals file
    add_contributor_totals('all.contributions', diffs)
    write_contributions('all.contributions', date, diffs)

    # create and update contributors file
    add_contributor_totals(contributor, diffs, email)
    write_contributions(contributor, date, diffs)

# close contribution files
series_close()

# write profiles to contrib.json
write_profile()
