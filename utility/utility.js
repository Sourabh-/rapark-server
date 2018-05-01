exports.replaceStr = (str, arr) => {
	for(let i=0; i < arr.length; i++) {
		let startIndex = str.indexOf('$');
		let lastIndex = str.indexOf('$', (startIndex + 1));
		let word = '';
		for(let j=startIndex; j <= lastIndex; j++)
			word += str[j];
		str = str.replace(word, arr[i]);
	}

	return str;
}