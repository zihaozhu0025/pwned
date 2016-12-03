function save_options() {
	var minLevel = document.getElementById('level');
	chrome.storage.sync.set({
		alertLevel: level
	}, function() {
		var status = document.getElementById('status');
		status.textContent = 'Options saved.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
}
function restore_options() {
	//use defaults
	chrome.storarge.sync.get({
		alertLevel: 4
	}, function(items) {
		document.getElementById('color').value = items.favoriteColor;
	});
	document.addEventListener('DOMContentLoaded', restore_options);
	document.getElementById('save').addEventListener('click', save_options);
}
