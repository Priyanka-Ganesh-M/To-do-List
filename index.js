import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
const app = express();
const port = 3000;

app.use(express.static("public"));

app.use(bodyParser.urlencoded(import.meta.url));
app.set("view enjine","ejs");
mongoose.connect("mongodb://127.0.0.1:27017/todoListDB", {useNewUrlParser: true}).then(function(){
    console.log("connected")}).catch(function(err){
        console.log(err);
    });

const itemSchema = new mongoose.Schema({
    name : String,
});

const Item = new mongoose.model("Item",itemSchema);

const listSchema = new mongoose.Schema({
    name : String,
    list : [itemSchema]
});

const List = new mongoose.model("List", listSchema);

const item1 = new Item({
    name : "Run"
});

const item2 = new Item({
    name : "Work"
});

const item3 = new Item({
    name : "Practice play"
});


const defaultItems = [item1, item2, item3];



app.get("/",(req, res)=>{
    Item.find({}).then(function (foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems).then(function(){
                console.log("all items inserted")}).catch(function (err){
                    console.log(err);
                });
                res.redirect("/");
        }
        else
        {
        res.render("index.ejs", {listtitle : "Today", items: foundItems});
        }
    }).catch(function (err){
        console.log("Couldnt find any item");
    });
});

 app.post("/" , async (req,res)=>{
    const listType = req.body.list;
    const newItem = new Item({
        name : req.body["activity"],
    });

    if(listType == "Today")
    {
    newItem.save();
    res.redirect("/");
    }
    else
    {
        try{
        const foundList = await List.findOne({name : listType});
        if(foundList)
        {
            foundList.list.push(newItem);
            foundList.save();
            res.redirect("/"+listType);
        }
        else
        {
            const newList = new List({
                name : listType,
                list : defaultItems
            });
            newList.save();
            res.redirect("/"+listType);
        }
        }
        catch(err){
            console.log(err);
        }
        }
    });

app.post("/delete", (req,res)=>
{
    const deleteId = req.body.checkbox;
    const listname = req.body.listname;
    if(listname === "Today")
    {
    Item.findByIdAndRemove(deleteId).then(function (){
        console.log("Id element deleted")}).catch(function(err){
            console.log(err);
        });
        res.redirect("/");
    }
    else
    {
        let doc = List.findOneAndUpdate({name : listname},{$pull : {list : {_id : deleteId}}},{new : true}).then(function(doc){
            console.log("deleted item from list");
            res.redirect("/"+listname);
        }).catch(function(err){
            console.log("error while deleting");
        });
    }
});


app.get("/:customList", async (req,res)=>{
    const listType = _.capitalize(req.params.customList);
    try{
        const foundList = await List.findOne({name : listType});
        if(!foundList)
        {
            const newList = new List({
                name : listType,
                list : defaultItems
            });
            newList.save();
            console.log("new List");
            res.render("work.ejs",{listtitle :  listType, items : newList.list});
            
        }
        else if(foundList)
        {
            res.render("work.ejs",{listtitle: listType, items : foundList.list});
            console.log("found");
        }
        }
        catch(err){
            res.send(err);
        }
        });


app.listen(port, ()=>{
    console.log(`Listening to port: ${port}`);
});

