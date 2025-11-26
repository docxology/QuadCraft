<%!
	static String wholeState = "{\"QuadCraft\":{\"p\":0, \"v\":0}}";
	
	//one copy of parts of the V/Var tree.
	//keys that start with lowercase are built in such as p v t.
	//Keys that start with Capital are childs like in V.Hello.World .
	//TODO maybe this should be made mutable so its faster,
	//but probably the network will be the bottleneck
	//if theres just a few players so dont worry about it for now.
	//Also, immutable may make threading easier
	//since you can many-read but one-write.
	static NavigableMap V = immutable.occamsjsonds.JsonDS.emptyMap;
	
	static boolean testedOccamsJsonDS = false;
	
	//object such as NavigableMap, List, Double.
	//May not have well tested true, false, and null,
	//as those were added to JsonDS later.
	static Object jsonToOb(String json){
		return immutable.occamsjsonds.JsonDS.jsonParse(json);
	}
	
	static NavigableMap obToJson(Object ob){
		return immutable.occamsjsonds.JsonDS.jsonString(ob);
	}
	
	static String stringInStringOut(String i){
		if(!testedOccamsJsonDS){
			System.out.println("START: test json");
			immutable.occamsjsonds.TestJsonDS.main(new String[0]);
			System.out.println("END: test json. Look at output, it doesnt throw if its broken, but its been working.");
			testedOccamsJsonDS = true;
		}
		//String o = "{\"arbitraryData\":"+wholeState+", \"inWas\":"+i+"}";
		//boolean doWholeState = false;
		boolean doWholeState = true;
		if(doWholeState){
			if(!i.equals("{}")){ //only save state if received one from browser
				wholeState = i;
			}
			String o = wholeState;
			System.out.println("stringInStringOut\nIN: "+i+"\nOUT: "+o);
			return o;
		}else{ //partial state updates, partial V/Var tree
			//TODO
		}
	}
%><%
	String body = request.getReader().lines().reduce("", (a,b)->(a+b));
	if(body == null || body.trim().equals("")){
		body = "{}";
	}
	String i = body; //in
	String o = stringInStringOut(i); //out
	response.setContentType("application/json");
	out.print(o);
%>