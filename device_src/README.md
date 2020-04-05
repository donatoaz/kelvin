# Some random learnings

You need to harden your code and configs against general errors. This is far from a comprehensive list, but it's a struggle to build something that is resilient and HA.

## Default locale

### Symptom

```
perl: warning: Setting locale failed.
perl: warning: Please check that your locale settings:
	LANGUAGE = (unset),
	LC_ALL = (unset),
	LC_CTYPE = "en_US.UTF-8",
	LC_TERMINAL = "iTerm2",
	LANG = "en_GB.UTF-8"
    are supported and installed on your system.
perl: warning: Falling back to a fallback locale ("en_GB.UTF-8").
locale: Cannot set LC_CTYPE to default locale: No such file or directory
locale: Cannot set LC_ALL to default locale: No such file or directory
```

### Solution

```
$ export LANGUAGE=en_US.UTF-8
$ export LANG=en_US.UTF-8
$ export LC_ALL=en_US.UTF-8
$ locale-gen en_US.UTF-8 # this may not be necessary, since the command below will re-gen selected locales...
$ dpkg-reconfigure locales
```

## Time sync

It seems the raspi sync ntp time by default, so every now and again there was a skew in time which prevented many things (SSL for example) from working. Worst being the fact that we send with every temperature read a timestamp and that gets messed up with time is incorrect.

### Symptom

Every time battery runs out for some time, time will skewed after reboot.

### Solution

```
sudo apt install htpdate
```

## Running commands on start up

There is no standard way to run a command at start up on the raspi. I've tried most suggested alternatives - from adding to init.d, or rc.local and none worked, but good ol' cron.

### Symptom

Commands won't run at start up

### Solution

Create a cron job:

```
sudo crontab -e
```

Add the following line, which means: run at boot:

```bash
@reboot sh /path/to/your_script.sh > /var/log/your_log.log 2>&1
```

