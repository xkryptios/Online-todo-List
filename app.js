const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const secret = require(__dirname + "/secret.js");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(secret.server, {
	useNewUrlParser: true,
	useUnifiedTopology: true
});

const itemSchema = mongoose.Schema({
	name: String
});
const listSchema = mongoose.Schema({
	routeName: String,
	items: [itemSchema]
});

//model(collections)
const Item = mongoose.model("item", itemSchema);
const List = mongoose.model("list", listSchema);

//create a default set of documents
const item1 = new Item({
	name: "Welcome to TODO List"
});
const item2 = new Item({
	name: "Hit the + button to add new Item"
});
const item3 = new Item({
	name: "<-- Hit this to delete item"
});
const defaultItems = [item1, item2, item3];

//root route handdling
app.get("/", function(req, res) {
	//check for no. items in db
	Item.find({}, function(err, itemsfound) {
		//if no item in collection, add default and redirect
		if (itemsfound.length === 0) {
			Item.insertMany(defaultItems, function(err) {
				if (!err) {
					console.log("default items added succesfully");
					res.redirect("/");
				} else {
					console.log("unable to insert default item");
				}
			});
		} else {
			//render site
			res.render("list", { title: "Today", items: itemsfound });
		}
	});
});

//custom route handling
app.get("/:customRouteName", function(req, res) {
	const customRouteName = req.params.customRouteName;
	List.findOne({ routeName: customRouteName }, function(err, documentsFound) {
		//if number of documents found is 0, create a new page
		if (documentsFound === null) {
			const newlist = new List({
				routeName: customRouteName,
				items: defaultItems
			});
			newlist.save();
			console.log("new route: '" + newlist.routeName + "' created");
			res.redirect("/" + customRouteName);
		} else {
			res.render("list", {
				title: documentsFound.routeName,
				items: documentsFound.items
			});
		}
	});
});

//neeed to add functionality such that post from different route is identified
app.post("/delete", function(req, res) {
	const itemId = req.body.checkbox;
	const customRouteName = req.body.hidden;
	if (req.body.hidden === "Today") {
		Item.findByIdAndDelete(itemId, function(err) {
			if (!err) {
				console.log("id: " + itemId + " deleted successfully");
				res.redirect("/");
			} else {
				console.log("unable to delete item, id: " + itemId);
			}
		});
	} else {
		List.findOneAndUpdate(
			{ routeName: customRouteName },
			{ $pull: { items: { _id: itemId } } },
			function(err) {
				if (!err) {
					console.log("id: " + itemId + " deleted successfully");
					res.redirect("/" + customRouteName);
				} else {
					console.log("unable to delete item, id: " + itemId);
				}
			}
		);
	}
});

//neeed to add functionality such that post from different route is identified
app.post("/", function(req, res) {
	//make input into item object
	const content = new Item({
		name: req.body.text
	});

	//check where the request is post from. if from home route, append to home route
	if (req.body.button === "Today") {
		content.save();
		console.log("newly added item: " + content);
		res.redirect("/");
	} else {
		//if is not frome home route, find the items object in List collection
		List.findOne({ routeName: req.body.button }, function(
			err,
			documentsFound
		) {
			documentsFound.items.push(content);
			documentsFound.save();
			console.log(documentsFound);
			res.redirect("/" + req.body.button);
		});
	}
});

app.listen(process.env.PORT || 3000, function() {
	console.log("server began...");
});
