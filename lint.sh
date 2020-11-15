#!/bin/bash

output=`standard --fix zine.js`
errorCount=`echo "${output}" | wc -l`
echo "${output}"

msg="errors"
if [ $errorCount == 1 ]; then
	msg="error"
fi
echo "${errorCount} ${msg} found using standard"
