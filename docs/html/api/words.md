{% extend('api.html', {title: 'words'}) %}

## TOC

* [Overview]({{url(path)}}/#overview)
* [Paths]({{url(path)}}/#paths)
* [Reduce]({{url(path)}}/#reduce)
* [Compute]({{url(path)}}/#compute)
* [Effects]({{url(path)}}/#effects)
* [Watch]({{url(path)}}/#watch)

## Overview

Source:
<a href="https://github.com/Mitranim/prax/blob/master/lib/words.js" target="_blank">
`lib/words.js` <span class="fa fa-github"></span>
</a>

Collection of functions ("words") for expressing Prax applications. Most of them
are pure, small and composable.

<div>{{include('partials/paths.md')}}</div>
<div>{{include('partials/reduce.md')}}</div>
<div>{{include('partials/compute.md')}}</div>
<div>{{include('partials/effects.md')}}</div>
<div>{{include('partials/watch.md')}}</div>
