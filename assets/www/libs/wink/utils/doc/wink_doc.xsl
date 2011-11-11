<?xml version="1.0" encoding="ISO-8859-1"?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

	<xsl:template match="/">
		<html>
			<head>
				<title>WINK documentation</title>
				
				<style>
					html, body
					{
						margin: 0;
						padding: 0;
					}
					
					#doc
					{
						font-family: Helvetica, Arial, sans-serif;
						font-size: 12px;
					}
					
					h1, h2, h3, h4
					{
						margin: 0;
						font-size: 16px;
						font-weight: bold;
					}
					
					h2, h3
					{
						margin: 10px 0;
					}
					
					h3
					{
						font-size: 14px;
						text-decoration: underline;
					}
								
					h3, h4, h5
					{
						padding-left: 20px;
					}
					
					h5
					{
						margin: 0;
						font-size: 12px;
						font-weight: bold;
					}
					
					dl 
					{ 
						display: block;
						margin: 0 0 2px 0;					
					}

					dt 
					{  
						clear:   left;
						display:  block;
						font-weight: bold;
						float:   left;
						width:   125px;
					}

					dd 
					{
						clear:   right;
						display:  block;
						margin-left: 125px;
					}
						
					pre
					{ 
						font-family: Verdana, sans-serif;
 						overflow-x: auto;
 						white-space: pre-wrap;
 						white-space: -moz-pre-wrap !important;
 						white-space: -pre-wrap;
 						white-space: -o-pre-wrap;
 						word-wrap: break-word;
 					}
 					
 					#head_title
 					{
 						padding-left: 15px;
 					}
					
					.section
					{
						border-bottom: 1px solid;
						margin-bottom: 15px;
						padding: 20px;  
					}
					
					.section.nopadding
					{
						padding: 0; 
					}
					
					.section_header
					{
						border-bottom: 1px dotted;
						padding-left: 20px;  
					}

					.component, .test_page, .properties, .method
					{
						margin-bottom: 2px;
					}
					
					.method
					{
						border-bottom: 1px dashed;
					}
					
					.properties.white
					{
					}
					
					.properties.orange
					{
						padding-left: 20px;
					}
					
					.component
					{
						margin-bottom: 40px;
					}
					
					.event, .class
					{
						padding: 15px 0pt 15px 20px;
					}
					
					.property
					{
						padding: 10px 0px 10px 0px;
					}
					
					.code
					{
						margin: 0px 0px 10px 0px;
						padding: 20px ;
					}
					
				</style>
			</head>
			<body>
				<div id="doc">
					<ul class="w_list w_border w_radius">
						<li class="w_list_item w_list_header w_border_bottom w_bg_dark">
							<xsl:value-of select="module/title" />
						</li>
					</ul>
					<div class="section">
						<div>
							<xsl:value-of select="module/name" />
							
							<p><xsl:value-of select="module/description" /></p>
						</div>
					</div>
	
					<xsl:if test="module/test_pages">
						<div class="section_header">
							<h2 class="section_out">
								Test pages
							</h2>
						</div>
						<div class="section">
							<xsl:for-each select="module/test_pages/page">
								<dl class="test_page">
									<dt>name:</dt><dd><xsl:value-of select="url" /></dd>
									<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
								</dl>
							</xsl:for-each>
						</div>
					</xsl:if>
					
					<div class="section_header">
						<h2 class="section_out">
							Compatibility
						</h2>
					</div>
					<div class="section">
						<div>
							<pre><xsl:value-of select="module/compatibility" /></pre>
						</div>
					</div>
					
					<xsl:if test="module/dependencies">
						<div class="section_header">
							<h2 class="section_out">
								Dependencies
							</h2>
						</div>
						<div class="section">
							<div>
								<xsl:for-each select="module/dependencies/dependency">
									<div>
										<pre><xsl:value-of select="module_name" /></pre>
									</div>
								</xsl:for-each>
							</div>
						</div>
					</xsl:if>
					
					<div class="section_header">
						<h2 class="section_out">
							Instantiation
						</h2>
					</div>
					<div class="section nopadding">
						<div style="padding: 15px 0 15px 20px">
							<pre><xsl:value-of select="module/instanciation/description" /></pre>
						</div>
						<xsl:if test="module/instanciation/properties">
							<h3>Constructor properties</h3>
							<div class="properties">
								<xsl:for-each select="module/instanciation/properties/property">
									<dl class="property" style="padding-left: 20px">
										<dt>name:</dt><dd><xsl:value-of select="name" /></dd>
										<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
										<dt>type:</dt><dd><xsl:value-of select="type" /></dd>
										<dt>optional:</dt><dd><xsl:value-of select="is_optional" /></dd>
									</dl>
								</xsl:for-each>
							</div>
						</xsl:if>
						<h3>Code sample</h3>
						<pre class="code">
							<xsl:value-of select="module/instanciation/code_sample" />
						</pre>
					</div>
					
					<div class="section_header">
						<h2>
							Components
						</h2>
					</div>
					<div class="section nopadding" style="background: transparent">
						<xsl:for-each select="module/components/component">
						<div class="component">
	                        <dl style="padding: 15px 0 15px 20px">
								<dt>name:</dt><dd><b><xsl:value-of select="name" /></b></dd>
								<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
							</dl>
								<xsl:if test="public_methods">
									<h3>Public methods</h3>
									<xsl:for-each select="public_methods/method">
										<div class="method">
											<dl style="padding: 15px 0 15px 20px;">
												<dt>name:</dt><dd><xsl:value-of select="name" /></dd>
												<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
											</dl>
											<xsl:if test="parameters">
												<h5><u>Parameters</u></h5>
												<div class="properties orange">
													<xsl:for-each select="parameters/parameter">
														<dl class="property orange">
															<dt>name:</dt><dd><xsl:value-of select="name" /></dd>
															<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
															<dt>type:</dt><dd><xsl:value-of select="type" /></dd>
															<dt>optional:</dt><dd><xsl:value-of select="is_optional" /></dd>
														</dl>
													</xsl:for-each>
												</div>
											</xsl:if>
										</div>
									</xsl:for-each>
								</xsl:if>
								<xsl:if test="public_properties">
									<h3>Public properties</h3>
									<div class="properties">
										<xsl:for-each select="public_properties/property">
											<dl class="property" style="padding: 15px 0 15px 20px;">
												<dt>name:</dt><dd><xsl:value-of select="name" /></dd>
												<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
												<dt>type:</dt><dd><xsl:value-of select="type" /></dd>
											</dl>
										</xsl:for-each>
									</div>
								</xsl:if>
								<xsl:if test="events">
									<h3>Events</h3>
									<div class="method">
										<xsl:for-each select="events/event">
											<dl class="event">
												<dt>name:</dt><dd><xsl:value-of select="name" /></dd>
												<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
											</dl>
											<xsl:if test="return">
												<h4>Return values</h4>
												<div class="properties orange">
													<xsl:for-each select="return/property">
														<dl class="property orange">
															<dt>name:</dt><dd><xsl:value-of select="name" /></dd>
															<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
															<dt>type:</dt><dd><xsl:value-of select="type" /></dd>
														</dl>
													</xsl:for-each>
												</div>
											</xsl:if>
										</xsl:for-each>
									</div>
								</xsl:if>
							</div>
						</xsl:for-each>
					</div>
					
					<xsl:if test="module/styles">
						<div class="section_header">
							<h2 class="section_out">
								Styles
							</h2>
						</div>
						<div class="section nopadding">
							<h3 style="padding: 15px 0 15px 20px;">Classes</h3>
							<xsl:for-each select="module/styles/classes/class">
								<dl class="class">
									<dt>name:</dt><dd><xsl:value-of select="name" /></dd>
									<dt>description:</dt><dd><xsl:value-of select="description" /></dd>
								</dl>
							</xsl:for-each>
						</div>
					</xsl:if>
				</div>
			</body>
		</html>
	</xsl:template>

</xsl:stylesheet>