# -*- coding: utf-8 -*-
"""
Created on Mon Nov 24 11:28:18 2025

@author: belowga
"""

#Display books that user may like
#Based on: Favourite genres and if there are: Authors of books they have favourited or read recently. 

genres_favoris = {}
auteurs_recents = {}
auteurs_favoris={}
genres_recents = {}
bibliotheque = {}

def Rec_algo():
    recs = []
    for livre in bibliotheque:
        if livre['genre'] in genres_favoris or livre['genre'] in genres_recents:
            recs.append(livre)
        elif livre['auteur'] in auteurs_favoris or livre['auteur'] in auteurs_recents:
            recs.append(livre)
    return recs
