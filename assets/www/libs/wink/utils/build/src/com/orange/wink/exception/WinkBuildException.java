/*--------------------------------------------------------
 * Copyright (c) 2011, The Dojo Foundation
 * This software is distributed under the "Simplified BSD license",
 * the text of which is available at http://www.winktoolkit.org/licence.txt
 * or see the "license.txt" file for more details.
 *--------------------------------------------------------*/

/**
 * 
 */
package com.orange.wink.exception;

/**
 * @author Sylvain Lalande
 * 
 */
public class WinkBuildException extends Exception {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	/**
	 * 
	 */
	public WinkBuildException() {
		super();
	}

	/**
	 * 
	 * @param arg0
	 * @param arg1
	 */
	public WinkBuildException(final String arg0, final Throwable arg1) {
		super(arg0, arg1);
	}

	/**
	 * 
	 * @param arg0
	 */
	public WinkBuildException(final String arg0) {
		super(arg0);
	}

	/**
	 * 
	 * @param arg0
	 */
	public WinkBuildException(final Throwable arg0) {
		super(arg0);
	}
}
