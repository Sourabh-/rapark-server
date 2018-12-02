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

exports.decrypt = (crypto, algorithm, password, key) => {
	var decipher = crypto.createDecipher(algorithm, password)
	var dec = decipher.update(key,'hex','utf8')
	dec += decipher.final('utf8');
	return dec;
}

exports.encrypt = (crypto, algorithm, password, dbName) => {
  var cipher = crypto.createCipher(algorithm, password)
  var crypted = cipher.update(dbName, 'utf8', 'hex')
  crypted += cipher.final('hex');
  return crypted;
}