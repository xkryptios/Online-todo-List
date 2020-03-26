module.exports = getDate;

function getDate() {
	let today = new Date();

	let options = {
		weekday: "long",
		year: "numeric",
		month: "short",
		day: "numeric"
	};
	let date = today.toLocaleDateString("en-US", options);
	return date;
}
