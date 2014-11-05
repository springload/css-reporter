# CSS Reporter

Based on [The Specificity Graph](http://csswizardry.com/2014/10/the-specificity-graph/) by Harry Roberts

## Usage

```
npm install css-reporter
css-reporter "glob/to/css/files/**/*.css"
```

And visit `localhost:9000` in your browser


## Known issues

* Rules inside media queries don't behave properly
* !importants are ignored (they're a rule, not a selector)