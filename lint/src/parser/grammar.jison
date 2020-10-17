/* lexical grammar */
%lex
%x tag comment doctype import xmlpi

QTEXT                                  \"[^\"]+\"
SQTEXT                                 \'[^\']+\'
TEXT                                   [^\s>]+
IDENT                                  [_a-zA-Z][_\-0-9a-zA-Z]*
CTEXT                                  .+?/(\-\-\>)
XMLPITEXT                              .+?(?=\?>)

%%

<*>\s+                                 /* skip whitespace */
"<?xml"                                this.begin('xmlpi'); return 'XMLPISTART'
"<!DOCTYPE"                            this.begin('doctype'); return 'DOCSTART'
"<!--"                                 this.begin('comment'); return 'CSTag'
"<"                                    this.begin('tag'); return '<'
[^<]+                                  return 'TEXT'
<tag>">"                               this.popState(); return '>'
<tag>"/"                               return '/'
<tag>"="                               return 'EQ'
<tag,import>{QTEXT}                    yytext = yytext.slice(1,-1); ++yylloc.first_column; --yylloc.last_column; return 'TEXT'
<tag,import>{SQTEXT}                   yytext = yytext.slice(1,-1); ++yylloc.first_column; --yylloc.last_column; return 'TEXT'
<tag>{IDENT}                           return yy.bindingNames.includes(yytext) ? 'bindAttr' : 'Ident'
<import>"import"                       return 'IMPORT'
<import>"from"                         return 'FROM'
<import>"-->"                          this.popState(); this.popState(); return 'CETag'
<tag,import>{TEXT}                     return 'TEXT'
<comment>"ko-viewmodel:"               this.begin('import'); return 'VIEW_REF'
<comment>"ko"\s+                       return 'bindingText'
<comment>"/ko"\s+                      return 'bindingTextEnd'
<comment>"kolint-enable"\s+            return 'KOLINT_ENABLE'
<comment>"kolint-disable"\s+          	return 'KOLINT_DISABLE'
<comment>"-->"                         this.popState(); return 'CETag'
<comment>{CTEXT}                       return 'commentText'
<comment>{IDENT}                       return 'DIAGKEY'
<xmlpi>{XMLPITEXT}                     return 'XMLPITEXT'
<xmlpi>"?>"                            this.popState(); return 'XMLPIEND'
<doctype>">"                           this.popState(); return 'DOCEND'
<doctype>{TEXT}                        return 'TEXT'
<<EOF>>                                return 'EOF'
.                                      return 'INVALID'
/lex

/* operator associations and precedence */

%start document

%% /* language grammar */

document
    : xmlpi nodes EOF
        { return $nodes }
    | nodes EOF
        { return $nodes }
	 | EOF
        { return [] }
	 ;

nodes
    : nodes node
        { if ($node) $nodes.push($node); $$=$nodes }
    | node
        { $$ = $node ? [$node] : [] }
	 ;
    

node
    : textNode
    | comment
    | element
    | elementEnd
    | doctype
	 ;
    

textNode
    : TEXT
        { $$ = null }
	 ;
    

xmlpi
    : XMLPISTART XMLPITEXT XMLPIEND
        { $$ = null }
	 ;
    

doctype
    : DOCSTART TEXT DOCEND
        { $$ = null }
	 ;
    

comment
    : CSTag commentText CETag
        { $$=null }
    | CSTag VIEW_REF importRef CETag
        { $$ = $importRef }
	 | CSTag KOLINT_ENABLE diagIds CETag
		  { $$ = yy.createDiagNode(@$, $diagIds, true) }
	 | CSTag KOLINT_DISABLE diagIds CETag
		  { $$ = yy.createDiagNode(@$, $diagIds, false) }
	 | CSTag KOLINT_ENABLE CETag
		  { $$ = yy.createDiagNode(@$, [], true) }
	 | CSTag KOLINT_DISABLE CETag
		  { $$ = yy.createDiagNode(@$, [], false) }
    | CSTag bindingText commentText CETag
        { $$ = yy.createStartNode(@$, 'comment-binding'); $$.bindings = [yy.createBindingData(@commentText, $commentText)]; $$.loc = @3 }
    | CSTag bindingTextEnd CETag
        { $$ = yy.createEndNode(@$, 'comment-binding') }
    | CSTag bindingTextEnd commentText CETag
        { $$ = yy.createEndNode(@$, 'comment-binding') }
	 ;
    

diagIds
	 : diagIds ',' DIAGKEY
	 		{ $$ = $diagIds.concat($DIAGKEY) }
	 | DIAGKEY
			{ $$ = $1 ? [$1] : [] }
	 ;
	 

importRef
    : IMPORT Ident from TEXT
        { $$ = yy.createViewRefNode(@$, $TEXT, $Ident) }
    | TEXT
        { $$ = yy.createViewRefNode(@$, $TEXT) }
   	// /** TODO
	   //  * Check for `get from` import statements which can be used as a little trick for typescript
	   //  * files not exporting the ViewModel. e.g. "ko-viewmodel: get VM from 'path/to/file'"
	   //  */
	 ;

element
    : '<' Ident bindingAttribs possiblyClosed '>'
        {
            $$ = $possiblyClosed ? yy.createEmptyNode(@$, $Ident) : yy.createStartNode(@$, $Ident)
            if ($bindingAttribs.length)
                $$.bindings = $bindingAttribs
        }
    | '<' Ident possiblyClosed '>'
        { $$ = $possiblyClosed ? yy.createEmptyNode(@$, $Ident) : yy.createStartNode(@$, $Ident) }
	 ;

possiblyClosed
    : '/'
        { $$=true }
    | /*empty*/
        { $$=false }
	 ;

elementEnd
    : '<' '/' Ident '>'
        { $$ = yy.createEndNode(@$, $3) }
	 ;

bindingAttribs
    : bindingAttribs attrib
	 		{ $$ = $bindingAttribs.concat($attrib) }
    | attrib
        { $$ = $1 ? [].concat($1) : [] }
	 ;

attrib
    : bindAttr EQ attribValue
        { $$=yy.createBindingData(@attribValue, $attribValue) }
    | Ident EQ attribValue
        { $$=[] }
    | Ident
        { $$=[] }
	 ;

attribValue
    : TEXT
    | Ident
	 ;