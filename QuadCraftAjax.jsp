<%!
	static String wholeState = "{\"QuadCraft\":{\"p\":0, \"v\":0}}";
	
	static String stringInStringOut(String i){
		String o = "{\"arbitraryData\":"+wholeState+", \"inWas\":"+i+"}";
		System.out.println("stringInStringOut\nIN: "+i+"\nOUT: "+o);
		return o;
	}
%><%
	String body = request.getReader().lines().reduce("", (a,b) -> a + b);
	if(body == null || body.trim().equals("")){
		body = "{}";
	}
	String i = body; //in
	String o = stringInStringOut(i); //out
	response.setContentType("application/json");
	out.print(o);
%>