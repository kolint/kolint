/* lexical grammar */
%lex
%x tag comment doctype import kodirective xmlpi lintSwitch

QTEXT                                      \"[^\"]+\"
SQTEXT                                     \'[^\']+\'
TEXT                                       [^\s>]+
IDENT                                      [_$a-zA-Z\xA0-\uFFFF][_$\-a-zA-Z0-9\xA0-\uFFFF]*
CTEXT                                      [\s\S]+?/(\-\-\>)
XMLPITEXT                                  .+?(?=\?>)
KOEND                                      \/ko/(\-\-\>)

%%

<*>\s+                                     /* skip whitespace */
"<?xml"                                    this.begin('xmlpi'); return 'XMLPISTART'
"<!DOCTYPE"                                this.begin('doctype'); return 'DOCSTART'
"<!--"                                     this.begin('comment'); return 'CSTag'
"<"                                        this.begin('tag'); return '<'
[^<]+                                      return 'TEXT'
<tag>">"                                   this.popState(); return '>'
<tag>"/"                                   return '/'
<tag>"="                                   return 'EQ'
<tag,import>{QTEXT}                        yytext = yytext.slice(1,-1); ++yylloc.range[0]; --yylloc.range[1]; return 'TEXT'
<tag,import>{SQTEXT}                       yytext = yytext.slice(1,-1); ++yylloc.range[0]; --yylloc.range[1]; return 'TEXT'
<tag>{IDENT}                               return yy.bindingNames.includes(yytext) ? 'bindAttr' : 'Ident'
<import>"{"                                return 'LBRACE'
<import>"}"                                return 'RBRACE'
<import,lintSwitch>","                     return 'COMMA'
<tag,import>":"                            return 'COLON'
<import>"import"                           return 'IMPORT'
<kodirective>"typeof"                      return 'TYPEOF'
<kodirective>"."                           return 'DOT'
<import>"as"                               return 'AS'
<import>"*"                                return 'STAR'
<import>"from"                             return 'FROM'
<import,kodirective,lintSwitch>"-->"       this.popState(); this.popState(); return 'CETag'
<import,kodirective>{IDENT}                return 'Ident'
<import,tag>{TEXT}                         return 'TEXT'
<comment>"ko-import"                       this.begin('import'); return 'IMPORT'
<comment>"ko-viewmodel"                    this.begin('kodirective'); return 'VIEW_REF'
<comment>"ko-context-name"                 this.begin('kodirective'); return 'CONTEXT_NAME'
<comment>"ko-context"                      this.begin('kodirective'); return 'CONTEXT'
<comment>"ko"\s                            return 'bindingText'
<comment>"/ko"\s                           return 'bindingTextEnd'
<comment>{KOEND}                           return 'bindingTextEnd'
<comment>"kolint-enable"                   this.begin('lintSwitch'); return 'KOLINT_ENABLE'
<comment>"kolint-disable"                  this.begin('lintSwitch'); return 'KOLINT_DISABLE'
<comment>"-->"                             this.popState(); return 'CETag'
<comment>{CTEXT}                           return 'commentText'
<lintSwitch>{IDENT}                        return 'DIAGKEY'
<xmlpi>{XMLPITEXT}                         return 'XMLPITEXT'
<xmlpi>"?>"                                this.popState(); return 'XMLPIEND'
<doctype>">"                               this.popState(); return 'DOCEND'
<doctype>{TEXT}                            return 'TEXT'
<<EOF>>                                    return 'EOF'
.                                          return 'INVALID'
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
  : CSTag commentTexts CETag
    { $$=null }
  | CSTag CETag
    { $$=null }
  | CSTag IMPORT importStmnt CETag
    { $$ = $importStmnt }
  | CSTag VIEW_REF typeRef CETag
    { $$ = yy.createChildContext(@$, $typeRef) }
  | CSTag CONTEXT_NAME Ident CETag
    { $$ = yy.createNamedContext(@$, yy.ident($Ident, @Ident)) }
  | CSTag CONTEXT Ident DOT xValue CETag
    { $$ = yy.createContextAssignment(@$, yy.ident($Ident, @Ident), $xValue) }
  | CSTag CONTEXT Ident CETag
    { $$ = yy.createContextAssignment(@$, yy.ident($Ident, @Ident)) }
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

commentTexts
  : commentTexts commentText
  | commentText
  ;

diagIds
  : diagIds COMMA DIAGKEY
    { $$ = $diagIds.concat($DIAGKEY) }
  | DIAGKEY
    { $$ = $1 ? [$1] : [] }
  ;

element
  : '<' tagName bindingAttribs possiblyClosed '>'
    {
      $$ = $possiblyClosed ? yy.createEmptyNode(@$, $tagName) : yy.createStartNode(@$, $tagName)
      if ($bindingAttribs.length)
        $$.bindings = $bindingAttribs
    }
  | '<' tagName possiblyClosed '>'
    { $$ = $possiblyClosed ? yy.createEmptyNode(@$, $tagName) : yy.createStartNode(@$, $tagName) }
  ;

tagName
  : Ident COLON Ident
  | Ident
  ;

possiblyClosed
  : '/'
    { $$=true }
  | /*empty*/
    { $$=false }
  ;

elementEnd
  : '<' '/' tagName '>'
    { $$ = yy.createEndNode(@$, $tagName) }
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
  | attribName EQ attribValue
    { $$=[] }
  | attribName
    { $$=[] }
  ;
attribName
  : Ident COLON Ident
  | Ident
  ;

attribValue
  : TEXT
  | Ident
  ;

// ---------------------------------------------------------------------------------------------

importStmnt
  : importSymbols FROM TEXT
    { $$ = yy.createImportNode(@$, $importSymbols, yy.ident($TEXT, @TEXT)) }
  ;

importSymbols
  : Ident
    {
      $$ = [{ name: yy.ident('default', @Ident), alias: yy.ident($Ident, @Ident) }]
    }
  | Ident COMMA LBRACE namedImports RBRACE
    {
      // import a, { b, c as d, ... } from ...
      $$ = $namedImports.concat({ name: yy.ident('default', @Ident), alias: yy.ident($Ident, @Ident) })
    }
  | LBRACE namedImports RBRACE
    {
      // import {a, b, c as d, default as e, ... } from ...
      $$ = $namedImports
    }
  | STAR AS Ident
    {
      // Namespace import (import * as a from ...)
      $$ = [{ name: yy.ident('*', @STAR), alias: yy.ident($3, @3) }]
    }
  ;

namedImports
  : namedImports COMMA namedImport
    { $$ = $namedImports.concat($namedImport) }
  | namedImport
    { $$ = [$namedImport] }
  ;

namedImport
  : Ident AS Ident
    { $$ = { name: yy.ident($1, @1), alias: yy.ident($3, @3) } }
  | Ident
    { $$ = { name: yy.ident($1, @1), alias: yy.ident($1, @1) } }
  ;

typeRef
  : Ident
    { $$ = yy.createTypeRef(@$, yy.ident($Ident, @Ident), true) }
  | TYPEOF Ident
    { $$ = yy.createTypeRef(@$, yy.ident($Ident, @Ident), false) }
  ;

xValue
  : xValue DOT Ident
  |	Ident
  ; // TODO: add support for calling members and indexers

