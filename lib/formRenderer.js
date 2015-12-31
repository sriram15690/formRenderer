var formRenderer = function (conf) {
    this.init = function () {
        this.beforeRender();
        $.ajax({
            url: conf.url,
            dataType: "json",
            success: function (data) {
                formRenderer.call(this);
                var formData = data.formData;
                var form = "";
                if (!conf.rowStruct) {
                    conf.rowStruct = "<div class='row'><div class='labelHolder'>$lab$</div><div class='elementHolder'>$ele$</div></div>";
                }
                $.each(formData, function (index, item) {
                    var temp = conf.rowStruct.split("$");
                    temp[temp.indexOf("lab")] = util.buildHTML("label", item.label, {"for": (item.hasOwnProperty("attr")) ? item.attr.name : ""});
                    temp[temp.indexOf("ele")] = util.buildElement(item);
                    form += temp.join("");
                });
                var submitButton = util.buildHTML("input", {
                    "type": "submit", "value": "Submit"
                });
                $(conf.target).html((conf.preserveHTML ? $(conf.target).html() : "") + util.buildHTML("form", form + submitButton, {
                    id: conf.name,
                    class: "formDynamicRender",
                    action: conf.mode === "php" ? conf.postURL : ""
                }));
                if (conf.validation) {
                    this.configureValidator(conf, formData);
                }
                if (conf.mode !== "php") {
                    $("#" + conf.name).on("submit", function (e) {
                        formRenderer.call(this);
                        e.preventDefault();
                        this.sendData(conf);
                    });
                }
                this.afterRender(conf);
            },
            error: function () {
                alert("Something went Wrong");
            }
        });
    };
    this.beforeRender = function () {
        if (!!conf.beforeRender) {
            conf.beforeRender();
        }
    };
    this.configureValidator = function (conf, formData) {
        var temp = {};
        $.each(formData, function (i, ele) {
            if (ele.hasOwnProperty("attr")) {
                temp[ele.hasOwnProperty("attr") ? ele.attr.name : ele.data[1].attr.name] = ele.validation;
            } else {
                $.each(ele.data, function (ind, data) {
                    temp[data.attr.name] = data.validation;
                })
            }
        });
        $("#" + conf.name).validate({
            rules: temp
        });
        jQuery.extend(jQuery.validator.messages, conf.confErrorMessages);
        $.each(Object.keys(conf.confErrorMessages),function(i,v){
            if(conf.confErrorMessages[v].indexOf("$$")>-1){
                $.validator.messages[v]  = function (param, input) {
                    var temp = conf.confErrorMessages[v].split("$$");
                    temp[temp.indexOf("fieldName")] = input.name;
                    return temp.join("");
                }
            }
        });
    };
    this.sendData = function (conf) {
        var frm = $("#" + conf.name);
        var data = JSON.stringify(frm.serializeArray());
        if ($("#" + conf.name).valid()) {
            console.log(data);
        }
    };
    this.afterRender = function (conf) {
        if (!!conf.afterRender) {
            conf.afterRender();
        }
    };
};
var util = {
    "buildHTML": function (tag, html, attrs) {
        if (typeof(html) != 'string') {
            attrs = html;
            html = null;
        }
        var h = '<' + tag;
        for (attr in attrs) {
            if (attrs[attr] === false) continue;
            h += ' ' + attr + '="' + attrs[attr] + '"';
        }
        return h += html ? ">" + html + "</" + tag + ">" : "/>";
    },
    "buildElement": function (item) {
        var html = "";
        if (item.tag === "select") {
            var temp = "";
            $.each(item.options, function (i, o) {
                temp += util.buildHTML("option", o.name, o.attr)
            });
            html = util.buildHTML("select", temp, item.attr);
        } else {
            switch (item.type) {
                case "radio":
                    $.each(item.data, function (i, v) {
                        html += util.buildHTML("label", v.label, {"for": v.attr.id}) + util.buildHTML("input", util.addRetProp(v.attr, {"type": item.type, "name": item.attr.name}));
                    });
                    break;
                case "checkBox":
                    $.each(item.data, function (i, v) {
                        html += util.buildHTML("label", v.label, {"for": v.attr.id}) + util.buildHTML("input", util.addRetProp(v.attr, {"type": "checkbox"}));
                    });
                    break;
                default:
                    html = util.buildHTML(item.tag,item.attr);
                    break;
            }
        }
        return html;
    },
    "addRetProp": function (obj, prop) {
        $.each(Object.keys(prop), function (i, v) {
            obj[v] = prop[v];
        });
        return obj;
    }
};

