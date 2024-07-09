import os
dirname = os.path.dirname(__file__)
shadername = "ringshader"

text = 'var RingShaderDict = {"vertexShader":[';
filename = os.path.join(dirname,shadername+"_vert.glsl")
fp = open(filename,"r")
li = 0
for line in fp:
	line = line.replace("\r\n","")
	line = line.replace("\n","")
	if(len(line)==0):
		continue	
	if li != 0:
		text+=","	
	text+='"'+line+'"'
	li = li + 1
fp.close()
text +='],\n"fragmentShader":['
filename = os.path.join(dirname,shadername+"_frag.glsl")
fp = open(filename,"r")
li = 0
for line in fp:
	line = line.replace("\r\n","")
	line = line.replace("\n","")
	if(len(line)==0):
		continue	
	if li != 0:
		text+=","	
	text+='"'+line+'"'
	li = li + 1
	if li % 100==0:
		text+='\n'
fp.close()
text += ']}\n'
filename = os.path.join(dirname,"RingShaderDict.js")
fp = open(filename,"w")
fp.write(text)
fp.close()