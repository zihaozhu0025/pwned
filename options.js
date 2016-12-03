function save_options() {
	var minLevel = document.getElementById('level').value;
	chrome.storage.sync.set({
		alertLevel: minLevel
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
	chrome.storage.sync.get({
		alertLevel: 4
	}, function(items) {
		document.getElementById('level').value = items.alertLevel;
	});
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
